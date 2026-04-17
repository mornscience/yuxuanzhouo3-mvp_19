import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { createClient } from "@supabase/supabase-js"

function getSb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const status = req.nextUrl.searchParams.get("status") || ""
    const search = req.nextUrl.searchParams.get("search") || ""
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100")
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0")

    const sb = getSb()
    let query = sb.from("user_reports").select("*").order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`reporter_email.ilike.%${search}%,reported_user_email.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 获取总数用于分页
    const { count } = await sb.from("user_reports").select("*", { count: "exact", head: true })

    // 应用分页
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      data: data || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const { id, status, resolutionNotes } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "缺少必要参数" }, { status: 400 })
    }

    const sb = getSb()
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      resolved_at: status !== "pending" ? new Date().toISOString() : null,
      resolved_by: session.adminId
    }

    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes
    }

    const { data, error } = await sb
      .from("user_reports")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}