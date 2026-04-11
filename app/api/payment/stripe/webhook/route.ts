import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { dbAdapter } from "@/lib/db-adapter"
import { parseAmount, formatAmount } from "@/lib/api-utils"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-01-27.acacia" })

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature") || ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || "")
  } catch (err: any) {
    console.error("[Stripe Webhook] 签名验证失败:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const amount = parseFloat(session.metadata?.amount || "0")

    // ── 会员购买处理 ──────────────────────────────────
    const { planId, membershipId, aiQuota, planName, months, expiresAt } = session.metadata || {}
    if (planId && membershipId && userId) {
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { randomUUID } = await import("crypto")

        // 记录会员
        await sb.from("user_memberships").upsert({
          id: membershipId,
          user_id: userId, plan_id: planId, plan_name: planName,
          region: "intl", duration: session.metadata?.duration || "monthly",
          amount_paid: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || "usd",
          discount_code: session.metadata?.discountCode || null,
          ai_quota_granted: aiQuota,
          expires_at: expiresAt,
          payment_method: "stripe",
          payment_id: session.id,
          status: "active",
          created_at: new Date().toISOString(),
        }, { onConflict: "id" })

        // 增加 AI 额度
        const quotaToAdd = parseFloat(aiQuota || "0")
        if (quotaToAdd > 0) {
          const { data: quota } = await sb.from("ai_search_quota").select("*").eq("user_id", userId).single().catch(() => ({ data: null }))
          const newBalance = parseFloat(((quota?.balance || 0) + quotaToAdd).toFixed(4))
          await sb.from("ai_search_quota").upsert({
            id: quota?.id || `quota-${randomUUID().slice(0, 8)}`,
            user_id: userId, balance: newBalance,
            total_used: quota?.total_used || 0,
            call_count: quota?.call_count || 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" })
          console.log(`[Stripe Webhook] 用户 ${userId} 购买会员，增加 AI 额度 ${quotaToAdd}，新余额 ${newBalance}`)
        }
        return NextResponse.json({ received: true })
      } catch (err) {
        console.error("[Stripe Webhook] 会员处理失败:", err)
      }
    }

    // ── 普通充值处理 ──────────────────────────────────
    if (userId && amount > 0) {
      try {
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
          orderId: session.id,
          status: "success",
          remark: `Stripe 充值 $${amount}`,
        })
        console.log(`[Stripe Webhook] 用户 ${userId} 充值 $${amount} 成功`)
      } catch (err) {
        console.error("[Stripe Webhook] 更新余额失败:", err)
      }
    }
  }

  return NextResponse.json({ received: true })
}
