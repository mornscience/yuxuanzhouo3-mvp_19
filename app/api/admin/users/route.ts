import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { createClient } from "@supabase/supabase-js"

function getSb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  const search = req.nextUrl.searchParams.get("search") || ""
  const sb = getSb()

  let query = sb.from("users").select("id, email, created_at").order("created_at", { ascending: false }).limit(100)
  if (search) query = query.ilike("email", `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // 获取 profiles
  const ids = (data || []).map((u: any) => u.id)
  const { data: profiles } = await sb.from("user_market_profiles").select("userId, nickname, balance").in("userId", ids)
  const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.userId, p]))

  const users = (data || []).map((u: any) => ({
    ...u,
    nickname: profileMap[u.id]?.nickname,
    balance: profileMap[u.id]?.balance ?? 0,
  }))

  return NextResponse.json({ ok: true, data: users })
}
