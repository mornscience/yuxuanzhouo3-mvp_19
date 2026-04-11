import { NextRequest, NextResponse } from "next/server"

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET /api/market/membership/plans?region=cn
export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region") || "cn"
  try {
    const sb = await getSupabase()
    const { data, error } = await sb.from("membership_plans")
      .select("*").eq("region", region).order("months", { ascending: true })
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
