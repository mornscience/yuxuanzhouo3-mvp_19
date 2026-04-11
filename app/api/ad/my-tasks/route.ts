import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PARTICIPATIONS_TABLE = "ad_participations"
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

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")

    const filters: Record<string, any> = { userId }
    if (statusFilter) filters.status = statusFilter

    const participations = await dbAdapter.loadRows(PARTICIPATIONS_TABLE, filters)
    participations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 并发关联广告信息
    const list = await Promise.all(
      participations.map(async (p) => {
        const adId = p.adId
        let adRows = await dbAdapter.loadRows(ADS_TABLE, { id: adId })
        if (!adRows.length) adRows = await dbAdapter.loadRows(ADS_TABLE, { _id: adId })
        const ad = adRows[0] || null
        return {
          id: p.id || p._id,
          userId: p.userId,
          adId: p.adId,
          status: p.status || "进行中",
          rewardEarned: p.rewardEarned || "0",
          completedAt: p.completedAt || null,
          createdAt: p.created_at || "",
          ad: ad ? {
            id: ad.id || ad._id,
            brand: ad.brand || "",
            type: ad.type || "",
            duration: ad.duration || "",
            reward: ad.reward || "0",
            videoUrl: ad.videoUrl || "",
            status: ad.status || "",
          } : null,
        }
      })
    )

    return ok("获取我的任务成功", { list, total: list.length })
  } catch (error: any) {
    console.error("[ad/my-tasks]", error)
    return fail(error?.message || "获取失败", 500)
  }
}
