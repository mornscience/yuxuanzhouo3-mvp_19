import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

// 表名常量
const ACQUISITION_ADS_TABLE = "acquisition_ads"

export async function GET(request: NextRequest) {
  try {
    // 验证登录（达人查看需要登录）
    requireAuth(request)

    // 获取查询参数
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // 获取所有活跃广告（状态为active）
    const ads = await dbAdapter.loadRows(ACQUISITION_ADS_TABLE, { status: "active" })

    // 按创建时间倒序排序
    ads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 简单分页
    const paginatedAds = ads.slice(skip, skip + limit)

    return successResponse("获取广告列表成功", {
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