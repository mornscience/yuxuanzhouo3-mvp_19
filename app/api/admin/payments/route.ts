import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { createClient } from "@supabase/supabase-js"

function getSb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  const sb = getSb()
  const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(100)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, data: data || [] })
}
