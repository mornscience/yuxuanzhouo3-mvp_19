import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { insertB2BLead } from "@/lib/market/acquisition"

export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, ["name", "region", "contact", "email", "type"])
    if (validationError) {
      throw new Error(validationError)
    }

    const {
      name,
      region,
      contact,
      email,
      estValue = "待评估",
      type, // "follow" 或 "publish"
      description,
    } = body

    // 创建B2B线索
    const result = await insertB2BLead(userId, {
      name,
      region,
      contact,
      email,
      estValue,
      type,
      description,
    })

    const message = type === "publish" 
      ? "合作需求发布成功" 
      : "企业线索录入成功"

    return successResponse(message, result)

  } catch (error) {
    return handleApiError(error)
  }
}