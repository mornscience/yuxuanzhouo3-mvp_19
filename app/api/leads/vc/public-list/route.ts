import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError } from "@/lib/api-utils"
import { loadPublicVCLeads } from "@/lib/market/acquisition"

export async function GET(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 获取查询参数
    const url = new URL(request.url)
    const region = url.searchParams.get("region") || undefined
    const focus = url.searchParams.get("focus") || undefined
    const minFunding = url.searchParams.get("minFunding")
      ? parseFloat(url.searchParams.get("minFunding")!)
      : undefined
    const maxFunding = url.searchParams.get("maxFunding")
      ? parseFloat(url.searchParams.get("maxFunding")!)
      : undefined
    const sortBy = (url.searchParams.get("sortBy") as "newest" | "highestFunding") || "newest"

    // 获取公开的VC线索池列表
    const leads = await loadPublicVCLeads({
      region,
      focus,
      minFunding,
      maxFunding,
      sortBy,
    })

    return successResponse("获取VC线索池列表成功", {
      data: leads,
      total: leads.length,
    })

  } catch (error) {
    return handleApiError(error)
  }
}
