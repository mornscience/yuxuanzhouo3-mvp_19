import { NextRequest, NextResponse } from "next/server"

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/market/membership/discount  { code }
export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code?.trim()) return NextResponse.json({ ok: false, message: "请输入折扣码" }, { status: 400 })
  try {
    const sb = await getSupabase()
    const { data, error } = await sb.from("discount_codes")
      .select("*").eq("code", code.trim().toUpperCase()).single()
    if (error || !data) return NextResponse.json({ ok: false, message: "折扣码无效" }, { status: 404 })
    if (data.expires_at && new Date(data.expires_at) < new Date())
      return NextResponse.json({ ok: false, message: "折扣码已过期" }, { status: 400 })
    if (data.used_count >= data.max_uses)
      return NextResponse.json({ ok: false, message: "折扣码已达使用上限" }, { status: 400 })
    return NextResponse.json({ ok: true, discount: data.discount, code: data.code })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
