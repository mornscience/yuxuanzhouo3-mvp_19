import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

const USER_TRANSACTIONS_TABLE = "user_transactions"

/**
 * GET /api/wallet/transactions
 * 获取个人资金流水列表
 * 支持按类型筛选：type
 * 按时间倒序
 */
export async function GET(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    // 构建过滤条件
    const filters: Record<string, any> = { userId }
    if (type && ["reward", "recharge", "withdraw", "charge", "refund"].includes(type)) {
      filters.type = type
    }

    // 查询流水记录
    const transactions = await dbAdapter.loadRows(USER_TRANSACTIONS_TABLE, filters)

    // 按时间倒序排列
    const sortedTransactions = transactions.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return successResponse("获取流水记录成功", {
      total: sortedTransactions.length,
      list: sortedTransactions
    })

  } catch (error) {
    return handleApiError(error)
  }
}
