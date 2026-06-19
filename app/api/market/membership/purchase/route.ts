import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"

// 添加超时和重试配置
const FETCH_TIMEOUT = 30000 // 30秒超时
const MAX_RETRIES = 2 // 最大重试次数

async function fetchWithTimeout(url: string, options: any = {}, timeout: number = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchWithRetry(url: string, options: any = {}, retries: number = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options)
      if (response.ok) {
        return response
      }
      // 如果不是网络错误，直接返回
      return response
    } catch (error: any) {
      lastError = error
      console.warn(`[fetchWithRetry] Attempt ${attempt}/${retries} failed:`, error.message)
      // 如果是超时错误，重试
      if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.code === 'ECONNRESET' || error.name === 'AbortError') {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // 指数退避
        }
      } else {
        throw error // 非网络错误直接抛出
      }
    }
  }
  
  throw lastError || new Error(`请求失败，已重试 ${retries} 次`)
}

function getUserId(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function grantQuota(userId: string, aiQuota: number) {
  const sb = await getSupabase()
  const { data: quota } = await sb.from("ai_search_quota").select("*").eq("user_id", userId).maybeSingle()
  const newBalance = parseFloat(((quota?.balance || 0) + aiQuota).toFixed(4))
  await sb.from("ai_search_quota").upsert({
    id: quota?.id || `quota-${randomUUID().slice(0, 8)}`,
    user_id: userId, balance: newBalance,
    total_used: quota?.total_used || 0,
    call_count: quota?.call_count || 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" })
  return newBalance
}

// POST /api/market/membership/purchase
// body: { planId, discountCode?, paymentMethod: "stripe" | "paypal" }
export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

  const { planId, discountCode, paymentMethod = "stripe" } = await req.json()
  if (!planId) return NextResponse.json({ ok: false, message: "请选择套餐" }, { status: 400 })

  try {
    const sb = await getSupabase()

    // 查套餐
    const { data: plan, error: planErr } = await sb.from("membership_plans").select("*").eq("id", planId).single()
    if (planErr || !plan) return NextResponse.json({ ok: false, message: "套餐不存在" }, { status: 404 })

    let finalPrice = parseFloat(plan.final_price)
    let usedCode: string | null = null

    // 验证折扣码
    if (discountCode?.trim()) {
      const { data: dc } = await sb.from("discount_codes")
        .select("*").eq("code", discountCode.trim().toUpperCase()).maybeSingle()
      if (dc && dc.used_count < dc.max_uses && (!dc.expires_at || new Date(dc.expires_at) > new Date())) {
        finalPrice = parseFloat((finalPrice * dc.discount).toFixed(2))
        usedCode = dc.code
        // 折扣码使用次数+1
        await sb.from("discount_codes").update({ used_count: (dc.used_count || 0) + 1 }).eq("code", dc.code)
      }
    }

    const membershipId = `mem-${randomUUID().slice(0, 8)}`
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + plan.months)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // ── 微信支付（国内）──────────────────────────────────
    if (paymentMethod === "wechat_pay") {
      const res = await fetch(`${baseUrl}/api/payment/wechat/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: `market_user_id=${userId}` },
        body: JSON.stringify({ amount: finalPrice, planId, planName: plan.name }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message || "创建微信支付订单失败")
      return NextResponse.json({ ok: true, type: "wechat", codeUrl: data.codeUrl, outTradeNo: data.outTradeNo })
    }

    // ── Stripe ──────────────────────────────────────────
    if (paymentMethod === "stripe") {
      const Stripe = (await import("stripe")).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-03-25.dahlia" as any })
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: `mornbusiness ${plan.name}` },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${baseUrl}/market/membership/success?session_id={CHECKOUT_SESSION_ID}&membership_id=${membershipId}`,
        cancel_url: `${baseUrl}/market/membership?cancelled=1`,
        metadata: {
          userId, planId, membershipId,
          discountCode: usedCode || "",
          aiQuota: String(plan.ai_quota),
          planName: plan.name,
          months: String(plan.months),
          expiresAt: expiresAt.toISOString(),
        },
      })
      return NextResponse.json({ ok: true, type: "stripe", url: session.url })
    }

    // ── PayPal ──────────────────────────────────────────
    if (paymentMethod === "paypal") {
      const PAYPAL_BASE = process.env.PAYPAL_ENVIRONMENT === "production"
        ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

      const tokenRes = await fetchWithRetry(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      })
      
      if (!tokenRes.ok) {
        const errorData = await tokenRes.json().catch(() => ({ message: "获取 PayPal 访问令牌失败" }))
        throw new Error(errorData.message || "获取 PayPal 访问令牌失败")
      }
      
      const { access_token } = await tokenRes.json()

      const orderRes = await fetchWithRetry(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: { currency_code: "USD", value: finalPrice.toFixed(2) },
            description: `mornbusiness ${plan.name}`,
            custom_id: JSON.stringify({ userId, planId, membershipId, aiQuota: plan.ai_quota, expiresAt: expiresAt.toISOString() }),
          }],
        }),
      })
      
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.message || "创建 PayPal 订单失败")

      return NextResponse.json({ ok: true, type: "paypal", orderId: order.id })
    }

    return NextResponse.json({ ok: false, message: "不支持的支付方式" }, { status: 400 })
  } catch (e: any) {
    console.error("[membership purchase]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}

// POST /api/market/membership/purchase/capture  (PayPal 捕获)
// 单独用 capture 子路由处理，这里提供一个 PUT 方法复用
export async function PUT(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ ok: false, message: "orderId 缺失" }, { status: 400 })

  try {
    const PAYPAL_BASE = process.env.PAYPAL_ENVIRONMENT === "production"
      ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

    const tokenRes = await fetchWithRetry(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })
    
    if (!tokenRes.ok) {
      const errorData = await tokenRes.json().catch(() => ({ message: "获取 PayPal 访问令牌失败" }))
      throw new Error(errorData.message || "获取 PayPal 访问令牌失败")
    }
    
    const { access_token } = await tokenRes.json()

    const captureRes = await fetchWithRetry(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` },
    })
    const capture = await captureRes.json()
    if (!captureRes.ok || capture.status !== "COMPLETED") throw new Error("PayPal 支付未完成")

    // 解析 custom_id
    const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id || ""
    let meta: any = {}
    try { meta = JSON.parse(customId) } catch {}

    const { planId, membershipId, aiQuota, expiresAt } = meta
    if (!planId) return NextResponse.json({ ok: false, message: "订单信息缺失" }, { status: 400 })

    const sb = await getSupabase()
    const { data: plan } = await sb.from("membership_plans").select("*").eq("id", planId).single()

    // 记录会员
    await sb.from("user_memberships").insert({
      id: membershipId || `mem-${randomUUID().slice(0, 8)}`,
      user_id: userId, plan_id: planId, plan_name: plan?.name,
      region: plan?.region, duration: plan?.duration,
      amount_paid: capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value,
      currency: "usd",
      ai_quota_granted: aiQuota || plan?.ai_quota,
      expires_at: expiresAt,
      payment_method: "paypal",
      payment_id: orderId,
      status: "active",
      created_at: new Date().toISOString(),
    })

    // 增加额度
    const newBalance = await grantQuota(userId, parseFloat(aiQuota || plan?.ai_quota || "0"))
    const remainingCalls = Math.floor(newBalance / 0.0005)

    return NextResponse.json({
      ok: true,
      message: `购买成功！已增加约 ${Math.floor(parseFloat(aiQuota || "0") / 0.0005).toLocaleString()} 次 AI 搜索额度`,
      newBalance, remainingCalls,
    })
  } catch (e: any) {
    console.error("[membership paypal capture]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
