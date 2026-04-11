import { NextRequest, NextResponse } from "next/server"
import { createDecipheriv } from "crypto"
import { randomUUID } from "crypto"

export const runtime = "nodejs"

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function decryptResource(resource: any) {
  const key = process.env.WECHAT_PAY_API_V3_KEY!
  const { ciphertext, nonce, associated_data } = resource
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key), Buffer.from(nonce))
  decipher.setAAD(Buffer.from(associated_data))
  decipher.setAuthTag(Buffer.from(ciphertext, "base64").slice(-16))
  const encrypted = Buffer.from(ciphertext, "base64").slice(0, -16)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return JSON.parse(decrypted.toString())
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.event_type !== "TRANSACTION.SUCCESS") {
      return NextResponse.json({ code: "SUCCESS", message: "OK" })
    }

    const trade = decryptResource(body.resource)
    if (trade.trade_state !== "SUCCESS") {
      return NextResponse.json({ code: "SUCCESS", message: "OK" })
    }

    const attach = JSON.parse(trade.attach || "{}")
    const userId = attach.userId
    const planId = attach.planId
    const amount = trade.amount.total / 100 // 分转元

    if (userId && planId) {
      const sb = await getSupabase()
      const { data: plan } = await sb.from("membership_plans").select("*").eq("id", planId).single()
      if (plan) {
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + plan.months)
        await sb.from("user_memberships").insert({
          id: `mem-${randomUUID().slice(0, 8)}`,
          user_id: userId, plan_id: planId, plan_name: plan.name,
          region: "cn", duration: plan.duration,
          amount_paid: amount, currency: "cny",
          ai_quota_granted: plan.ai_quota,
          expires_at: expiresAt.toISOString(),
          payment_method: "wechat_pay",
          payment_id: trade.transaction_id,
          status: "active",
          created_at: new Date().toISOString(),
        })
        // 增加 AI 额度
        const { data: quota } = await sb.from("ai_search_quota").select("*").eq("user_id", userId).maybeSingle()
        const newBalance = parseFloat(((quota?.balance || 0) + parseFloat(plan.ai_quota)).toFixed(4))
        await sb.from("ai_search_quota").upsert({
          id: quota?.id || `quota-${randomUUID().slice(0, 8)}`,
          user_id: userId, balance: newBalance,
          total_used: quota?.total_used || 0,
          call_count: quota?.call_count || 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
      }
    }

    return NextResponse.json({ code: "SUCCESS", message: "OK" })
  } catch (e: any) {
    console.error("[WechatPay Notify]", e)
    return NextResponse.json({ code: "FAIL", message: e.message }, { status: 500 })
  }
}
