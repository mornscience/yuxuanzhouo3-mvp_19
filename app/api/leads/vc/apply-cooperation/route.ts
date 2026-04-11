import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { applyForVCCooperation } from "@/lib/market/acquisition"

export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const applicantId = requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, [
      "leadId",
      "applicantName",
      "applicantContact",
      "applicantEmail",
    ])
    if (validationError) {
      throw new Error(validationError)
    }

    const {
      leadId,
      applicantName,
      applicantContact,
      applicantEmail,
      message,
    } = body

    // 提交对接申请
    const result = await applyForVCCooperation(leadId, applicantId, {
      applicantName,
      applicantContact,
      applicantEmail,
      message,
    })

    if (!result.success) {
      throw new Error(result.message)
    }

    return successResponse(result.message, null)

  } catch (error) {
    return handleApiError(error)
  }
}
