import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, parseAmount, formatAmount } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

const USER_TRANSACTIONS_TABLE = "user_transactions"
const USER_MARKET_PROFILES_TABLE = "user_market_profiles"

/**
 * GET /api/wallet/task-earnings
 * 达人查看自己所有任务赚了多少钱
 * 返回：总佣金、可提现、已提现
 */
export async function GET(request: NextRequest) {
  try {
    const userId = requireAuth(request)

    // 查询所有 reward 类型流水
    const rewardTxs = await dbAdapter.loadRows(USER_TRANSACTIONS_TABLE, {
      userId,
      type: "reward",
      status: "success",
    })

    // 查询所有 withdraw 类型流水
    const withdrawTxs = await dbAdapter.loadRows(USER_TRANSACTIONS_TABLE, {
      userId,
      type: "withdraw",
      status: "success",
    })

    const totalEarned = rewardTxs.reduce((sum: number, tx: any) => sum + parseAmount(tx.amount), 0)
    const totalWithdrawn = withdrawTxs.reduce((sum: number, tx: any) => sum + Math.abs(parseAmount(tx.amount)), 0)

    // 当前可提现余额从 profile 取
    const profile = await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { id: userId })
    const available = parseAmount(profile?.balance || "0")

    return successResponse("获取任务收益成功", {
      totalEarned: formatAmount(totalEarned),
      available: formatAmount(available),
      totalWithdrawn: formatAmount(totalWithdrawn),
      rewardCount: rewardTxs.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
