import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

// 表名常量
const ACQUISITION_BLOGGERS_TABLE = "acquisition_bloggers"

export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const userId = requireAuth(request)

    // 解析请求体
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, ["name", "platform", "followers", "email"])
    if (validationError) {
      throw new Error(validationError)
    }

    const {
      name,
      platform,
      followers,
      email,
      commission = "待商议",
      cost = "待商议"
    } = body

    // 检查是否已存在该用户的达人资料
    const existingBloggers = await dbAdapter.loadRows(ACQUISITION_BLOGGERS_TABLE, { userId })

    let result
    if (existingBloggers.length > 0) {
      // 更新现有资料
      const existing = existingBloggers[0]
      result = await dbAdapter.updateRow(
        ACQUISITION_BLOGGERS_TABLE,
        { _id: existing._id },
        {
          name,
          platform,
          followers,
          email,
          commission,
          cost,
          updated_at: new Date().toISOString()
        }
      )
    } else {
      // 创建新资料
      result = await dbAdapter.insertRow(ACQUISITION_BLOGGERS_TABLE, {
        userId,
        name,
        platform,
        followers,
        email,
        commission,
        cost,
        status: "available" // 默认状态
      })
    }

    return successResponse("达人资料保存成功", result)

  } catch (error) {
    return handleApiError(error)
  }
}