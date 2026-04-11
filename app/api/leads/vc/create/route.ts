import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { insertVCLead } from "@/lib/market/acquisition"

export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 根据类型验证必填字段
    const type = body.type || "follow"
    const baseFields = ["name", "region", "contact", "email", "focus"]

    // 发布型融资需求需要额外字段
    if (type === "publish") {
      baseFields.push("fundingAmount", "fundingStage")
    }

    const validationError = validateRequiredFields(body, baseFields)
    if (validationError) {
      throw new Error(validationError)
    }

    const {
      name,
      region,
      contact,
      email,
      focus,
      fundingAmount,
      fundingStage,
      description,
    } = body

    // 创建VC线索
    const result = await insertVCLead(userId, {
      name,
      region,
      contact,
      email,
      focus,
      type,
      fundingAmount,
      fundingStage,
      description,
    })

    const message = type === "publish"
      ? "融资需求发布成功"
      : "投资机构线索添加成功"

    return successResponse(message, result)

  } catch (error) {
    return handleApiError(error)
  }
}