import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { codeStore } from "../send/route"

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/auth/sms/verify  { phone, code }
export async function POST(req: NextRequest) {
  const { phone, code } = await req.json()
  if (!phone || !code) return NextResponse.json({ ok: false, message: "参数缺失" }, { status: 400 })

  const stored = codeStore.get(phone)
  if (!stored) return NextResponse.json({ ok: false, message: "验证码不存在或已过期" }, { status: 400 })
  if (Date.now() > stored.expires) {
    codeStore.delete(phone)
    return NextResponse.json({ ok: false, message: "验证码已过期，请重新获取" }, { status: 400 })
  }
  if (stored.code !== String(code)) {
    return NextResponse.json({ ok: false, message: "验证码错误" }, { status: 400 })
  }
  codeStore.delete(phone)

  try {
    const sb = await getSupabase()
    const now = new Date().toISOString()

    // 查找或创建用户
    const { data: existing } = await sb.from("users").select("id").eq("phone", phone).single().catch(() => ({ data: null }))
    // phone 字段可能不存在，用 email 占位查
    const phoneEmail = `phone_${phone}@sms.local`
    const { data: existingByEmail } = await sb.from("users").select("id,email").eq("email", phoneEmail).single().catch(() => ({ data: null }))

    let userId: string
    let isNew = false

    if (existing?.id) {
      userId = existing.id
    } else if (existingByEmail?.id) {
      userId = existingByEmail.id
    } else {
      // 新用户注册
      isNew = true
      const { data: newUser, error } = await sb.from("users").insert({
        id: `u-${randomUUID().slice(0, 8)}`,
        email: phoneEmail,
        password: `sms_${phone}`,
        role: "user",
        provider: "sms",
        created_at: now, updated_at: now,
      }).select("id").single()
      if (error) throw error
      userId = newUser.id

      // 创建资料
      await sb.from("user_profiles").insert({ id: userId, user_id: userId, nickname: `用户${phone.slice(-4)}`, avatar: "", phone, created_at: now })
      await sb.from("user_market_profiles").insert({
        id: userId, user_id: userId, nickname: `用户${phone.slice(-4)}`, avatar: "",
        is_influencer_verified: false, is_merchant_verified: false,
        is_real_name_verified: false, is_real_influencer: false, is_real_merchant: false,
        balance: 0, total_earnings: 0, ad_views_count: 0, created_at: now, updated_at: now,
      })
      // 分配初始 AI 额度
      await sb.from("ai_search_quota").upsert({
        id: `quota-${randomUUID().slice(0, 8)}`,
        user_id: userId, balance: 0.1, total_used: 0, call_count: 0,
        created_at: now, updated_at: now,
      }, { onConflict: "user_id" })
    }

    const response = NextResponse.json({
      ok: true, message: isNew ? "注册并登录成功" : "登录成功",
      user: { userId, phone },
    })
    response.cookies.set("market_user_id", userId, {
      path: "/", maxAge: 60 * 60 * 24 * 7, httpOnly: true, sameSite: "lax",
    })
    return response
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
