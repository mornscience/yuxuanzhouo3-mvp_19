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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return fail("用户未登录", 401)

    const { adId } = await params

    // 先按自定义 id 查，再按 _id 查
    let rows = await dbAdapter.loadRows(ADS_TABLE, { id: adId })
    if (!rows.length) rows = await dbAdapter.loadRows(ADS_TABLE, { _id: adId })
    if (!rows.length) return fail("广告不存在", 404)

    const r = rows[0]
    const ad = {
      id: r.id || r._id,
      brand: r.brand || "",
      type: r.type || "",
      duration: r.duration || "",
      reward: r.reward || "0",
      status: r.status || "",
      views: r.views || 0,
      videoUrl: r.videoUrl || "",
      createdAt: r.created_at || "",
    }

    return ok("获取广告详情成功", { ad })
  } catch (error: any) {
    console.error("[ad/detail]", error)
    return fail(error?.message || "获取失败", 500)
  }
}
