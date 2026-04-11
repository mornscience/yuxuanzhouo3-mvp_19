import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError } from "@/lib/api-utils"
import { loadMyVCLeads } from "@/lib/market/acquisition"

export async function GET(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 获取当前用户的VC线索（按类型分类）
    const { followList, publishList } = await loadMyVCLeads(userId)

    return successResponse("获取投资机构线索列表成功", {
      followList,
      publishList,
    })

  } catch (error) {
    return handleApiError(error)
  }
}