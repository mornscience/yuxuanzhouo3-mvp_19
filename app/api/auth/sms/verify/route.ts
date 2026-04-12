import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/auth/sms/verify  { phone, code }
export async function POST(req: NextRequest) {
  const { phone, code } = await req.json()
  if (!phone || !code) return NextResponse.json({ ok: false, message: "Missing parameters" }, { status: 400 })

  const sb = await getSupabase()

  // 从数据库读取验证码
  const { data: stored, error } = await sb
    .from("sms_codes")
    .select("code, expires_at")
    .eq("phone", phone)
    .single()

  if (error || !stored) {
    return NextResponse.json({ ok: false, message: "Verification code does not exist or has expired" }, { status: 400 })
  }
  if (new Date(stored.expires_at) < new Date()) {
    await sb.from("sms_codes").delete().eq("phone", phone)
    return NextResponse.json({ ok: false, message: "Verification code expired, please request a new one" }, { status: 400 })
  }
  if (stored.code !== String(code)) {
    return NextResponse.json({ ok: false, message: "Incorrect verification code" }, { status: 400 })
  }

  // 验证成功，删除验证码
  await sb.from("sms_codes").delete().eq("phone", phone)

  try {
    const now = new Date().toISOString()
    const phoneEmail = `phone_${phone}@sms.local`

    const { data: existingByEmail } = await sb
      .from("users")
      .select("id")
      .eq("email", phoneEmail)
      .single()
      .catch(() => ({ data: null }))

    let userId: string
    let isNew = false

    if (existingByEmail?.id) {
      userId = existingByEmail.id
    } else {
      isNew = true
      const { data: newUser, error: insertErr } = await sb
        .from("users")
        .insert({
          id: `u-${randomUUID().slice(0, 8)}`,
          email: phoneEmail,
          password: `sms_${phone}`,
          role: "user",
          provider: "sms",
          created_at: now,
          updated_at: now,
        })
        .select("id")
        .single()
      if (insertErr) throw insertErr
      userId = newUser.id

      await sb.from("user_profiles").insert({
        id: userId, user_id: userId,
        nickname: `User${phone.slice(-4)}`, avatar: "", phone, created_at: now,
      })
      await sb.from("user_market_profiles").insert({
        id: userId, user_id: userId,
        nickname: `User${phone.slice(-4)}`, avatar: "",
        is_influencer_verified: false, is_merchant_verified: false,
        is_real_name_verified: false, is_real_influencer: false, is_real_merchant: false,
        balance: 0, total_earnings: 0, ad_views_count: 0, created_at: now, updated_at: now,
      })
      await sb.from("ai_search_quota").upsert({
        id: `quota-${randomUUID().slice(0, 8)}`,
        user_id: userId, balance: 0.1, total_used: 0, call_count: 0,
        created_at: now, updated_at: now,
      }, { onConflict: "user_id" })
    }

    const response = NextResponse.json({
      ok: true,
      message: isNew ? "Registration and login successful" : "Login successful",
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
