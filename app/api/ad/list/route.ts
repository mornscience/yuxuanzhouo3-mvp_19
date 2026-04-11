import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ADS_TABLE = "acquisition_ads"

function ok(message: string, data?: any) {
  return NextResponse.json({ ok: true, message, data })
}
function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return fail("用户未登录", 401)

    // 同时查 status=投放中 和 status=active 兼容两种写法
    const [rows1, rows2] = await Promise.all([
      dbAdapter.loadRows(ADS_TABLE, { status: "投放中" }),
      dbAdapter.loadRows(ADS_TABLE, { status: "active" }),
    ])
    const rows = [...rows1, ...rows2]
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 规范化字段
    const list = rows.map(r => ({
      id: r.id || r._id,
      brand: r.brand || "",
      type: r.type || "",
      duration: r.duration || "",
      reward: r.reward || "0",
      status: r.status || "",
      views: r.views || 0,
      videoUrl: r.videoUrl || "",
      createdAt: r.created_at || "",
    }))

    return ok("获取广告列表成功", { list, total: list.length })
  } catch (error: any) {
    console.error("[ad/list]", error)
    return fail(error?.message || "获取失败", 500)
  }
}
