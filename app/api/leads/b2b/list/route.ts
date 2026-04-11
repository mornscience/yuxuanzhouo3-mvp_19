import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError } from "@/lib/api-utils"
import { loadMyB2BLeads } from "@/lib/market/acquisition"

export async function GET(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 获取当前用户的B2B线索（按type分类）
    const { followList, publishList } = await loadMyB2BLeads(userId)

    return successResponse("获取B2B企业线索列表成功", {
      data: {
        followList,
        publishList,
      },
      total: followList.length + publishList.length,
    })

  } catch (error) {
    return handleApiError(error)
  }
}