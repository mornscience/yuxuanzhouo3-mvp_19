import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function updateUserMarketProfile(sb: any, userId: string, expiresAt: Date, planName: string) {
  // 更新用户资料的会员状态（用于AI搜索模型切换）
  await sb.from("user_market_profiles").upsert({
    id: userId,
    is_premium: true,
    premium_expires_at: expiresAt.toISOString(),
    premium_plan: planName,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" })
  console.log(`[Membership Webhook] 用户 ${userId} 会员状态已更新: ${planName}, 到期时间 ${expiresAt.toISOString()}`)
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || ""
  
  // 前端直连调用（测试环境）
  if (contentType.includes("application/json")) {
    const body = await req.json()
    const { sessionId } = body
    
    if (sessionId) {
      try {
        const Stripe = (await import("stripe")).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-03-25.dahlia" })
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        
        const { userId, planId, membershipId, discountCode, aiQuota } = session.metadata as any
        if (!userId || !planId) return NextResponse.json({ ok: true })

        const sb = await getSupabase()
        const { data: plan } = await sb.from("membership_plans").select("*").eq("id", planId).single()
        if (!plan) return NextResponse.json({ ok: true })

        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + plan.months)

        // 记录会员
        await sb.from("user_memberships").upsert({
          id: membershipId || `mem-${randomUUID().slice(0, 8)}`,
          user_id: userId, plan_id: planId, plan_name: plan.name,
          region: plan.region, duration: plan.duration,
          amount_paid: session.amount_total / 100,
          currency: session.currency,
          discount_code: discountCode || null,
          ai_quota_granted: aiQuota || plan.ai_quota,
          expires_at: expiresAt.toISOString(),
          payment_method: "stripe",
          payment_id: session.id,
          status: "active",
          created_at: new Date().toISOString(),
        }, { onConflict: "id" })

        // 增加 AI 额度
        const quotaToAdd = parseFloat(aiQuota || plan.ai_quota)
        const { data: quota } = await sb.from("ai_search_quota").select("*").eq("user_id", userId).single()
        const newBalance = parseFloat(((quota?.balance || 0) + quotaToAdd).toFixed(4))
        await sb.from("ai_search_quota").upsert({
          id: quota?.id || `quota-${randomUUID().slice(0, 8)}`,
          user_id: userId, balance: newBalance,
          total_used: quota?.total_used || 0,
          call_count: quota?.call_count || 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })

        // 更新用户资料的会员状态（用于AI搜索模型切换）
        await updateUserMarketProfile(sb, userId, expiresAt, plan.name)

        return NextResponse.json({ ok: true, message: "会员状态更新成功" })
      } catch (e: any) {
        console.error("[membership webhook - direct call]", e)
        return NextResponse.json({ ok: false, message: e.message }, { status: 400 })
      }
    }
  }

  // Stripe Webhook 调用（生产环境）
  const body = await req.text()
  const sig = req.headers.get("stripe-signature") || ""

  try {
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-03-25.dahlia" })
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_MEMBERSHIP_WEBHOOK_SECRET || "")

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any
      const { userId, planId, membershipId, discountCode, aiQuota } = session.metadata || {}
      if (!userId || !planId) return NextResponse.json({ ok: true })

      const sb = await getSupabase()
      const { data: plan } = await sb.from("membership_plans").select("*").eq("id", planId).single()
      if (!plan) return NextResponse.json({ ok: true })

      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + plan.months)

      // 记录会员
      await sb.from("user_memberships").upsert({
        id: membershipId || `mem-${randomUUID().slice(0, 8)}`,
        user_id: userId, plan_id: planId, plan_name: plan.name,
        region: plan.region, duration: plan.duration,
        amount_paid: session.amount_total / 100,
        currency: session.currency,
        discount_code: discountCode || null,
        ai_quota_granted: aiQuota || plan.ai_quota,
        expires_at: expiresAt.toISOString(),
        payment_method: "stripe",
        payment_id: session.id,
        status: "active",
        created_at: new Date().toISOString(),
      }, { onConflict: "id" })

      // 增加 AI 额度
      const quotaToAdd = parseFloat(aiQuota || plan.ai_quota)
      const { data: quota } = await sb.from("ai_search_quota").select("*").eq("user_id", userId).single()
      const newBalance = parseFloat(((quota?.balance || 0) + quotaToAdd).toFixed(4))
      await sb.from("ai_search_quota").upsert({
        id: quota?.id || `quota-${randomUUID().slice(0, 8)}`,
        user_id: userId, balance: newBalance,
        total_used: quota?.total_used || 0,
        call_count: quota?.call_count || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

      // 更新用户资料的会员状态（用于AI搜索模型切换）
      await updateUserMarketProfile(sb, userId, expiresAt, plan.name)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("[membership webhook]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 400 })
  }
}
