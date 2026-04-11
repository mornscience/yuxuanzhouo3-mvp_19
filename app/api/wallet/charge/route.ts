import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, parseAmount, formatAmount } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

const USER_MARKET_PROFILES_TABLE = "user_market_profiles"
const USER_TRANSACTIONS_TABLE = "user_transactions"

/**
 * POST /api/wallet/charge
 * 商家发布广告时预扣费
 * 入参：adId, amount
 */
export async function POST(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const adId = String(body.adId || "").trim()
    if (!adId) {
      throw new Error("广告ID不能为空")
    }

    const amount = parseAmount(body.amount)
    if (!amount || amount <= 0) {
      throw new Error("扣费金额必须大于0")
    }

    // 获取钱包余额
    const profile = await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { id: userId })
    if (!profile) {
      throw new Error("钱包不存在，请先充值")
    }

    const currentBalance = parseAmount(profile.balance || "0")
    if (currentBalance < amount) {
      throw new Error(`余额不足，当前余额 ¥${formatAmount(currentBalance)}，需要 ¥${formatAmount(amount)}`)
    }

    const newBalance = currentBalance - amount

    await dbAdapter.updateRow(USER_MARKET_PROFILES_TABLE, { id: userId }, {
      balance: formatAmount(newBalance),
    })

    const transaction = await dbAdapter.insertRow(USER_TRANSACTIONS_TABLE, {
      userId,
      type: "charge",
      amount: formatAmount(-amount),
      balance: formatAmount(newBalance),
      orderId: adId,
      status: "success",
      remark: `广告扣费：${adId}`,
    })

    return successResponse("扣费成功", {
      adId,
      amount: formatAmount(amount),
      newBalance: formatAmount(newBalance),
      transaction,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
