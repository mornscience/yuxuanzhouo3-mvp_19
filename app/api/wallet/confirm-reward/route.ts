import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

const USER_MARKET_PROFILES_TABLE = "user_market_profiles"
const USER_TRANSACTIONS_TABLE = "user_transactions"
const AD_PARTICIPATIONS_TABLE = "ad_participations"
const ACQUISITION_ADS_TABLE = "acquisition_ads"

/**
 * 将金额转换为数字
 */
function parseAmount(amount: string | number): number {
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^\d.-]/g, "")) : amount
  return isNaN(num) ? 0 : num
}

/**
 * 格式化金额为字符串
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * POST /api/wallet/confirm-reward
 * 确认任务完成 → 发放佣金到余额
 * 入参：adId, participationId, rewardEarned
 */
export async function POST(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    // 验证必填字段
    const validationError = validateRequiredFields(body, ["adId", "participationId", "rewardEarned"])
    if (validationError) {
      throw new Error(validationError)
    }

    const { adId, participationId, rewardEarned } = body

    // 检查参与记录
    const participation = await dbAdapter.loadSingleRow(AD_PARTICIPATIONS_TABLE, {
      id: participationId,
      userId,
      adId
    })

    if (!participation) {
      throw new Error("未找到参与记录")
    }

    // 检查是否已发放佣金
    if (participation.status === "verified" || participation.rewardPaid) {
      throw new Error("佣金已发放，无需重复操作")
    }

    // 检查任务状态是否为已完成
    if (participation.status !== "completed") {
      throw new Error("任务尚未完成，无法发放佣金")
    }

    // 获取广告信息
    const ad = await dbAdapter.loadSingleRow(ACQUISITION_ADS_TABLE, { id: adId })
    const adTitle = ad?.title || adId

    // 计算佣金金额
    const rewardAmount = parseAmount(rewardEarned)
    if (rewardAmount <= 0) {
      throw new Error("佣金金额必须大于0")
    }

    // 获取用户钱包信息
    let profile = await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { id: userId })
    
    if (!profile) {
      // 创建钱包记录
      profile = await dbAdapter.insertRow(USER_MARKET_PROFILES_TABLE, {
        id: userId,
        balance: "0",
        totalEarnings: "0",
        adViewsCount: 0,
        isRealNameVerified: false,
        isInfluencerVerified: false,
        isMerchantVerified: false
      })
    }

    // 计算新余额
    const currentBalance = parseAmount(profile.balance || "0")
    const currentTotalEarnings = parseAmount(profile.totalEarnings || "0")
    const newBalance = currentBalance + rewardAmount
    const newTotalEarnings = currentTotalEarnings + rewardAmount

    // 更新用户钱包
    await dbAdapter.updateRow(
      USER_MARKET_PROFILES_TABLE,
      { id: userId },
      {
        balance: formatAmount(newBalance),
        totalEarnings: formatAmount(newTotalEarnings)
      }
    )

    // 写入流水记录
    const transaction = await dbAdapter.insertRow(USER_TRANSACTIONS_TABLE, {
      userId,
      type: "reward",
      amount: formatAmount(rewardAmount),
      balance: formatAmount(newBalance),
      orderId: adId,
      status: "success",
      remark: `任务佣金：${adTitle}`
    })

    // 更新参与记录为已发放
    await dbAdapter.updateRow(
      AD_PARTICIPATIONS_TABLE,
      { id: participationId },
      {
        status: "verified",
        rewardPaid: true,
        rewardPaidAt: new Date().toISOString(),
        transactionId: transaction._id
      }
    )

    return successResponse("佣金发放成功", {
      rewardAmount: formatAmount(rewardAmount),
      newBalance: formatAmount(newBalance),
      newTotalEarnings: formatAmount(newTotalEarnings),
      transaction
    })

  } catch (error) {
    return handleApiError(error)
  }
}
