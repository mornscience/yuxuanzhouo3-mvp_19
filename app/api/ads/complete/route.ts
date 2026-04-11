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
    const validationError = validateRequiredFields(body, ["adId", "rewardEarned"])
    if (validationError) {
      throw new Error(validationError)
    }

    const { adId, rewardEarned } = body

    // 检查参与记录
    const participation = await dbAdapter.loadSingleRow(AD_PARTICIPATIONS_TABLE, {
      userId,
      adId
    })
    if (!participation) {
      throw new Error("未找到参与记录")
    }

    // 检查状态
    if (participation.status === "completed") {
      throw new Error("任务已完成，无需重复提交")
    }

    // 更新参与记录为完成状态
    const updatedParticipation = await dbAdapter.updateRow(
      AD_PARTICIPATIONS_TABLE,
      { _id: participation._id },
      {
        status: "completed",
        rewardEarned,
        completedAt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    )

    if (!updatedParticipation) {
      throw new Error("更新任务状态失败")
    }

    return successResponse("任务完成提交成功", updatedParticipation)

  } catch (error) {
    return handleApiError(error)
  }
}