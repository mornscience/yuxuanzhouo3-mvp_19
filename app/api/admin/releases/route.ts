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
    const platform = req.nextUrl.searchParams.get("platform") || ""
    const status = req.nextUrl.searchParams.get("status") || ""
    const search = req.nextUrl.searchParams.get("search") || ""
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100")
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0")

    const sb = getSb()
    let query = sb.from("app_releases").select("*").order("created_at", { ascending: false })

    if (platform && platform !== "all") {
      query = query.eq("platform", platform)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`version.ilike.%${search}%,build_number.ilike.%${search}%,release_notes.ilike.%${search}%`)
    }

    // 获取总数用于分页
    const { count } = await sb.from("app_releases").select("*", { count: "exact", head: true })

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

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const body = await req.json()
    const {
      platform,
      version,
      buildNumber,
      releaseNotes,
      fileUrl,
      fileSize,
      isMandatory = false,
      status = "draft"
    } = body

    if (!platform || !version || !fileUrl) {
      return NextResponse.json({ ok: false, error: "缺少必要参数: platform, version, fileUrl" }, { status: 400 })
    }

    const sb = getSb()
    const now = new Date().toISOString()

    const { data, error } = await sb
      .from("app_releases")
      .insert({
        platform,
        version,
        build_number: buildNumber || null,
        release_notes: releaseNotes || "",
        file_url: fileUrl,
        file_size: fileSize || null,
        is_mandatory: isMandatory,
        status,
        created_at: now,
        updated_at: now,
        created_by: session.adminId
      })
      .select()
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const body = await req.json()
    const {
      id,
      platform,
      version,
      buildNumber,
      releaseNotes,
      fileUrl,
      fileSize,
      isMandatory,
      status
    } = body

    if (!id) {
      return NextResponse.json({ ok: false, error: "缺少必要参数: id" }, { status: 400 })
    }

    const sb = getSb()
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (platform !== undefined) updateData.platform = platform
    if (version !== undefined) updateData.version = version
    if (buildNumber !== undefined) updateData.build_number = buildNumber
    if (releaseNotes !== undefined) updateData.release_notes = releaseNotes
    if (fileUrl !== undefined) updateData.file_url = fileUrl
    if (fileSize !== undefined) updateData.file_size = fileSize
    if (isMandatory !== undefined) updateData.is_mandatory = isMandatory
    if (status !== undefined) updateData.status = status

    const { data, error } = await sb
      .from("app_releases")
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

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ ok: false, error: "缺少必要参数: id" }, { status: 400 })
    }

    const sb = getSb()
    const { error } = await sb.from("app_releases").delete().eq("id", id)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}