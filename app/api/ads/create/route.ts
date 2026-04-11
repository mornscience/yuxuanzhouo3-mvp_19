import { NextRequest } from "next/server"
import { requireMerchant, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

// 表名常量
const ACQUISITION_ADS_TABLE = "acquisition_ads"

export async function POST(request: NextRequest) {
  try {
    // 验证商家身份
    const userId = await requireMerchant(request)

    // 解析请求体
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, ["brand", "type", "duration", "reward"])
    if (validationError) {
      throw new Error(validationError)
    }

    const {
      brand,
      type,
      duration,
      reward
    } = body

    // 创建广告任务
    const result = await dbAdapter.insertRow(ACQUISITION_ADS_TABLE, {
      userId,
      brand,
      type,
      duration,
      reward,
      status: "active", // 默认状态
      views: 0 // 初始浏览量为0
    })

    return successResponse("广告任务发布成功", result)

  } catch (error) {
    return handleApiError(error)
  }
}