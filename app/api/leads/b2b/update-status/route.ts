import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { updateB2BLeadStatus } from "@/lib/market/acquisition"

// 允许的状态值（仅跟进型线索可用）
const VALID_STATUSES = ["初步接触", "跟进中", "合同拟定", "已转化", "已流失"]

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

    // 更新状态（函数内部会校验type=follow）
    const result = await updateB2BLeadStatus(userId, id, status)

    if (!result) {
      throw new Error("线索不存在、无权更新或该线索类型不支持更新进度")
    }

    return successResponse("进度更新成功", result)

  } catch (error) {
    return handleApiError(error)
  }
}