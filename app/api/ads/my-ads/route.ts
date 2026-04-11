import { NextRequest } from "next/server"
import { requireMerchant, successResponse, handleApiError } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

// 表名常量
const ACQUISITION_ADS_TABLE = "acquisition_ads"

export async function GET(request: NextRequest) {
  try {
    // 验证商家身份
    const userId = await requireMerchant(request)

    // 获取查询参数
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // 获取当前商家发布的所有广告
    const ads = await dbAdapter.loadRows(ACQUISITION_ADS_TABLE, { userId })

    // 按创建时间倒序排序
    ads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 简单分页
    const paginatedAds = ads.slice(skip, skip + limit)

    return successResponse("获取我的广告列表成功", {
      data: paginatedAds,
      pagination: {
        page,
        limit,
        total: ads.length,
        totalPages: Math.ceil(ads.length / limit)
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}