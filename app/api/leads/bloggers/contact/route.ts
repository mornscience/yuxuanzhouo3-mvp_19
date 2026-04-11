import { NextRequest } from "next/server"
import { requireMerchant, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

// 表名常量
const ACQUISITION_BLOGGERS_TABLE = "acquisition_bloggers"

export async function POST(request: NextRequest) {
  try {
    // 验证商家身份
    const userId = await requireMerchant(request)

    // 解析请求体
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, ["bloggerId"])
    if (validationError) {
      throw new Error(validationError)
    }

    const { bloggerId } = body

    // 查找达人资料
    const blogger = await dbAdapter.loadSingleRow(ACQUISITION_BLOGGERS_TABLE, { _id: bloggerId })
    if (!blogger) {
      throw new Error("达人资料不存在")
    }

    // 更新状态为 contacted
    const updated = await dbAdapter.updateRow(
      ACQUISITION_BLOGGERS_TABLE,
      { _id: bloggerId },
      {
        status: "contacted",
        updated_at: new Date().toISOString()
      }
    )

    if (!updated) {
      throw new Error("更新达人状态失败")
    }

    return successResponse("已标记为已联系", updated)

  } catch (error) {
    return handleApiError(error)
  }
}