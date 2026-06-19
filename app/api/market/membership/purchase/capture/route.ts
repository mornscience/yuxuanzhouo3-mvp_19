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

export async function GET(request: NextRequest) {
  console.log("[PayPal Capture] 收到请求 URL:", request.url)
  console.log("[PayPal Capture] 请求头:", request.headers)

  const { searchParams } = new URL(request.url)
  // PayPal 重定向时提供 token 参数，也可能提供 orderId 参数
  let orderId = searchParams.get("token") || searchParams.get("orderId")
  const payerId = searchParams.get("PayerID")
  const userId = getUserId(request)

  console.log("[PayPal Capture] 解析参数 - token/orderId:", orderId, "PayerID:", payerId, "userId:", userId)

  // 健康检查端点 - 用于测试路由是否可达
  if (searchParams.get("health") === "check") {
    return NextResponse.json({
      ok: true,
      message: "PayPal capture route is working",
      timestamp: new Date().toISOString(),
      path: "/api/market/membership/purchase/capture"
    })
  }

  if (!orderId) {
    console.error("[PayPal Capture] 错误: 订单ID不能为空")
    return NextResponse.json({
      ok: false,
      message: "订单ID不能为空",
      receivedParams: Array.from(searchParams.entries()),
      help: "PayPal should provide 'token' or 'orderId' parameter"
    }, { status: 400 })
  }

  if (!userId) {
    console.error("[PayPal Capture] 错误: 用户未登录")
    // 返回 401 而不是 404，帮助诊断路由是否可达
    return NextResponse.json({
      ok: false,
      message: "未登录",
      path: "/api/market/membership/purchase/capture",
      help: "Make sure you have 'market_user_id' cookie set"
    }, { status: 401 })
  }
  
  try {
    console.log("[PayPal Capture] 开始处理订单:", orderId, "用户:", userId)
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

    console.log("[PayPal Capture] 获取访问令牌成功，开始捕获订单")
    const captureRes = await fetchWithRetry(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` },
    })
    const capture = await captureRes.json()
    console.log("[PayPal Capture] 捕获响应:", capture)

    if (!captureRes.ok || capture.status !== "COMPLETED") {
      console.error("[PayPal Capture] 支付未完成，状态:", capture.status, "响应:", capture)
      throw new Error("PayPal 支付未完成")
    }

    // 解析 custom_id - PayPal 可能将 custom_id 放在不同位置
    let customId = capture.purchase_units?.[0]?.custom_id || ""
    if (!customId) {
      customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id || ""
    }
    console.log("[PayPal Capture] 解析的 customId:", customId)

    let meta: any = {}
    try { meta = JSON.parse(customId) } catch {}

    const { planId, membershipId, aiQuota, expiresAt } = meta
    if (!planId) {
      // 尝试从订单描述或其他字段获取信息
      console.warn("[PayPal Capture] 无法从 custom_id 解析订单信息，customId:", customId, "capture:", JSON.stringify(capture))
      throw new Error("订单信息缺失")
    }

    console.log("[PayPal Capture] 解析的订单信息:", meta)

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
    await grantQuota(userId, parseFloat(aiQuota || plan?.ai_quota || "0"))

    // 跳转到成功页面
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return NextResponse.redirect(`${baseUrl}/market/membership/success`)
  } catch (e: any) {
    console.error("[membership paypal capture]", e)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return NextResponse.redirect(`${baseUrl}/market/membership?error=${encodeURIComponent(e.message)}`)
  }
}
