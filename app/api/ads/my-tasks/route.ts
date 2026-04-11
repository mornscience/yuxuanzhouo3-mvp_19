import { NextRequest } from "next/server"
import { requireInfluencer, successResponse, handleApiError } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

// 表名常量
const AD_PARTICIPATIONS_TABLE = "ad_participations"
const ACQUISITION_ADS_TABLE = "acquisition_ads"

export async function GET(request: NextRequest) {
  try {
    // 验证达人身份
    const userId = await requireInfluencer(request)

    // 获取查询参数
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // 获取当前用户的所有参与记录
    const participations = await dbAdapter.loadRows(AD_PARTICIPATIONS_TABLE, { userId })

    // 按创建时间倒序排序
    participations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 获取关联的广告信息
    const tasksWithAds = []
    for (const participation of participations) {
      const ad = await dbAdapter.loadSingleRow(ACQUISITION_ADS_TABLE, { _id: participation.adId })
      tasksWithAds.push({
        ...participation,
        ad: ad || null
      })
    }

    // 简单分页
    const paginatedTasks = tasksWithAds.slice(skip, skip + limit)

    return successResponse("获取我的任务列表成功", {
      data: paginatedTasks,
      pagination: {
        page,
        limit,
        total: tasksWithAds.length,
        totalPages: Math.ceil(tasksWithAds.length / limit)
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}