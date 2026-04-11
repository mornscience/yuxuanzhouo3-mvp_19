import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import {
  loadMyVCReceivedApplications,
  loadMyVCSentApplications,
  updateVCApplicationStatus,
} from "@/lib/market/acquisition"

// GET: 获取我收到的对接申请
export async function GET(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 获取查询参数
    const url = new URL(request.url)
    const type = url.searchParams.get("type") || "received" // "received" | "sent"

    if (type === "received") {
      // 获取我收到的申请（我是融资需求发布者）
      const applications = await loadMyVCReceivedApplications(userId)
      return successResponse("获取收到的对接申请成功", applications)
    } else {
      // 获取我发送的申请（我申请的融资需求）
      const applications = await loadMyVCSentApplications(userId)
      return successResponse("获取发送的对接申请成功", applications)
    }

  } catch (error) {
    return handleApiError(error)
  }
}

// POST: 处理对接申请（同意/拒绝）
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, ["applicationId", "status"])
    if (validationError) {
      throw new Error(validationError)
    }

    const { applicationId, status } = body

    // 验证状态值
    if (status !== "approved" && status !== "rejected") {
      throw new Error("状态值无效，允许的值: approved, rejected")
    }

    // 更新申请状态
    const result = await updateVCApplicationStatus(userId, applicationId, status)

    if (!result.success) {
      throw new Error(result.message)
    }

    return successResponse(result.message, null)

  } catch (error) {
    return handleApiError(error)
  }
}
