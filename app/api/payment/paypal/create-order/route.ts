import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/api-utils"

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
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

    const { amount, currency = "USD" } = await request.json()
    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, message: "金额无效" }, { status: 400 })
    }

    const token = await getPayPalToken()
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: currency, value: amount.toFixed(2) },
          description: "mornbusiness 账户充值",
          custom_id: userId,
        }],
      }),
    })

    const order = await res.json()
    if (!res.ok) throw new Error(order.message || "创建 PayPal 订单失败")

    return NextResponse.json({ ok: true, orderId: order.id })
  } catch (error: any) {
    console.error("[PayPal Create Order]", error)
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }
}
