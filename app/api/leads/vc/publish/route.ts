import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { publishVCLead } from "@/lib/market/acquisition"

export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, ["leadId", "isPublic"])
    if (validationError) {
      throw new Error(validationError)
    }

    const { leadId, isPublic } = body

    // 发布/下架VC线索
    const result = await publishVCLead(userId, leadId, isPublic)

    if (!result) {
      throw new Error("融资需求不存在")
    }

    const message = isPublic
      ? "已上架到VC线索池"
      : "已从VC线索池下架"

    return successResponse(message, result)

  } catch (error: any) {
    if (error.message === "跟进型VC线索不能发布到线索池") {
      return handleApiError(new Error("跟进型VC线索不能发布到线索池"))
    }
    return handleApiError(error)
  }
}
