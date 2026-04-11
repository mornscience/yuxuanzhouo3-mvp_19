import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, parseAmount, formatAmount } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

const USER_MARKET_PROFILES_TABLE = "user_market_profiles"
const USER_TRANSACTIONS_TABLE = "user_transactions"

/**
 * POST /api/wallet/recharge
 * 模拟账户充值
 * 入参：amount
 */
export async function POST(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const amount = parseAmount(body.amount)
    if (!amount || amount <= 0) {
      throw new Error("充值金额必须大于0")
    }

    // 获取或初始化钱包
    let profile = await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { id: userId })
    if (!profile) {
      profile = await dbAdapter.insertRow(USER_MARKET_PROFILES_TABLE, {
        id: userId,
        balance: "0",
        totalEarnings: "0",
      })
    }

    const currentBalance = parseAmount(profile.balance || "0")
    const newBalance = currentBalance + amount

    await dbAdapter.updateRow(USER_MARKET_PROFILES_TABLE, { id: userId }, {
      balance: formatAmount(newBalance),
    })

    const transaction = await dbAdapter.insertRow(USER_TRANSACTIONS_TABLE, {
      userId,
      type: "recharge",
      amount: formatAmount(amount),
      balance: formatAmount(newBalance),
      orderId: "",
      status: "success",
      remark: "账户充值",
    })

    return successResponse("充值成功", {
      amount: formatAmount(amount),
      newBalance: formatAmount(newBalance),
      transaction,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
