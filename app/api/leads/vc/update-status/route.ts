import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { updateVCLeadStatus } from "@/lib/market/acquisition"

// 跟进型VC线索允许的状态值
const VALID_STATUSES = ["待联系", "初步沟通", "尽调", "投资"]

export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, ["id", "status"])
    if (validationError) {
      throw new Error(validationError)
    }

    const { id, status } = body

    // 验证状态值
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`状态值无效，允许的值: ${VALID_STATUSES.join(", ")}`)
    }

    // 更新状态（内部会检查type=follow）
    const updated = await updateVCLeadStatus(userId, id, status)

    if (!updated) {
      throw new Error("投资机构线索不存在")
    }

    return successResponse("线索对接阶段更新成功", updated)

  } catch (error: any) {
    if (error.message === "发布型融资需求不支持更新跟进进度") {
      return handleApiError(new Error("发布型融资需求不支持更新跟进进度"))
    }
    return handleApiError(error)
  }
}