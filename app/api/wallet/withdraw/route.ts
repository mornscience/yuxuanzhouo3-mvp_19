import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, parseAmount, formatAmount } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

const USER_MARKET_PROFILES_TABLE = "user_market_profiles"
const USER_TRANSACTIONS_TABLE = "user_transactions"

/**
 * POST /api/wallet/withdraw
 * 申请提现（模拟）
 * 入参：amount, accountInfo（支付宝/微信账号）
 */
export async function POST(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const amount = parseAmount(body.amount)
    if (!amount || amount <= 0) {
      throw new Error("提现金额必须大于0")
    }

    const accountInfo = String(body.accountInfo || "").trim()
    if (!accountInfo) {
      throw new Error("请填写提现账号（支付宝/微信）")
    }

    // 获取钱包余额
    const profile = await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { id: userId })
    if (!profile) {
      throw new Error("钱包不存在，请先充值或完成任务")
    }

    const currentBalance = parseAmount(profile.balance || "0")
    if (currentBalance < amount) {
      throw new Error(`余额不足，当前余额 ¥${formatAmount(currentBalance)}`)
    }

    const newBalance = currentBalance - amount

    await dbAdapter.updateRow(USER_MARKET_PROFILES_TABLE, { id: userId }, {
      balance: formatAmount(newBalance),
    })

    const transaction = await dbAdapter.insertRow(USER_TRANSACTIONS_TABLE, {
      userId,
      type: "withdraw",
      amount: formatAmount(-amount),
      balance: formatAmount(newBalance),
      orderId: "",
      status: "success",
      remark: `提现至：${accountInfo}`,
    })

    return successResponse("提现申请已提交", {
      amount: formatAmount(amount),
      newBalance: formatAmount(newBalance),
      accountInfo,
      transaction,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
