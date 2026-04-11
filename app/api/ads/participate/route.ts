import { NextRequest } from "next/server"
import { requireInfluencer, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

// 表名常量
const ACQUISITION_ADS_TABLE = "acquisition_ads"
const AD_PARTICIPATIONS_TABLE = "ad_participations"

export async function POST(request: NextRequest) {
  try {
    // 验证达人身份
    const userId = await requireInfluencer(request)

    // 解析请求体
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, ["adId"])
    if (validationError) {
      throw new Error(validationError)
    }

    const { adId } = body

    // 检查广告是否存在且状态为active
    const ad = await dbAdapter.loadSingleRow(ACQUISITION_ADS_TABLE, { _id: adId })
    if (!ad) {
      throw new Error("广告任务不存在")
    }
    if (ad.status !== "active") {
      throw new Error("该广告任务已不可参与")
    }

    // 检查是否已经参与过
    const existingParticipation = await dbAdapter.loadSingleRow(AD_PARTICIPATIONS_TABLE, {
      userId,
      adId
    })
    if (existingParticipation) {
      throw new Error("您已经参与过此广告任务")
    }

    // 创建参与记录
    const result = await dbAdapter.insertRow(AD_PARTICIPATIONS_TABLE, {
      userId,
      adId,
      status: "participated", // 初始状态
      rewardEarned: "0", // 初始奖励为0
      completedAt: null // 未完成
    })

    // 增加广告浏览量
    await dbAdapter.updateRow(
      ACQUISITION_ADS_TABLE,
      { _id: adId },
      {
        views: (ad.views || 0) + 1,
        updated_at: new Date().toISOString()
      }
    )

    return successResponse("成功参与广告任务", result)

  } catch (error) {
    return handleApiError(error)
  }
}