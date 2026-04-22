import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest, parseAmount, formatAmount } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

const PAYPAL_BASE = process.env.PAYPAL_ENVIRONMENT === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com"

async function getPayPalToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  // 处理 POST 请求
  return handleCapture(request)
}

export async function GET(request: NextRequest) {
  // 处理 GET 请求（用于跳转到 PayPal 支付页面）
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("orderId")
  
  if (!orderId) {
    return NextResponse.json({ ok: false, message: "orderId 不能为空" }, { status: 400 })
  }
  
  try {
    const token = await getPayPalToken()
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    
    const order = await res.json()
    if (!res.ok) {
      throw new Error(order.message || "获取 PayPal 订单失败")
    }
    
    // 查找 PayPal 支付链接
    const approvalUrl = order.links?.find((link: any) => link.rel === "approve")?.href
    if (approvalUrl) {
      // 跳转到 PayPal 支付页面
      return NextResponse.redirect(approvalUrl)
    } else {
      throw new Error("未找到 PayPal 支付链接")
    }
  } catch (error: any) {
    console.error("[PayPal Capture GET]", error)
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }
}

async function handleCapture(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

    const { orderId } = await request.json()
    if (!orderId) return NextResponse.json({ ok: false, message: "orderId 不能为空" }, { status: 400 })

    const token = await getPayPalToken()
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const capture = await res.json()
    if (!res.ok || capture.status !== "COMPLETED") {
      throw new Error(capture.message || "PayPal 支付未完成")
    }

    // 获取实际支付金额
    const unit = capture.purchase_units?.[0]
    const amount = parseFloat(unit?.payments?.captures?.[0]?.amount?.value || "0")

    if (amount > 0) {
      const PROFILES = "user_market_profiles"
      const TRANSACTIONS = "user_transactions"

      let profile = await dbAdapter.loadSingleRow(PROFILES, { id: userId })
      if (!profile) {
        profile = await dbAdapter.insertRow(PROFILES, { id: userId, balance: "0", totalEarnings: "0" })
      }

      const newBalance = parseAmount(profile.balance || "0") + amount
      await dbAdapter.updateRow(PROFILES, { id: userId }, { balance: formatAmount(newBalance) })
      await dbAdapter.insertRow(TRANSACTIONS, {
        userId, type: "recharge",
        amount: formatAmount(amount),
        balance: formatAmount(newBalance),
        orderId,
        status: "success",
        remark: `PayPal 充值 $${amount}`,
      })
    }

    return NextResponse.json({ ok: true, message: "支付成功，余额已更新", amount })
  } catch (error: any) {
    console.error("[PayPal Capture]", error)
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }
}
