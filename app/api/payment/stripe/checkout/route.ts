import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getUserIdFromRequest } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" })
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

    const { amount, currency = "usd" } = await request.json()
    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, message: "金额无效" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency,
          product_data: { name: "mornbusiness 账户充值" },
          unit_amount: Math.round(amount * 100), // Stripe 单位是分
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${baseUrl}/market/profile?payment=success&amount=${amount}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/market/profile?payment=cancelled`,
      metadata: { userId, amount: String(amount) },
    })

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id })
  } catch (error: any) {
    console.error("[Stripe Checkout]", error)
    return NextResponse.json({ ok: false, message: error.message || "创建支付失败" }, { status: 500 })
  }
}
