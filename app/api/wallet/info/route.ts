import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

const USER_MARKET_PROFILES_TABLE = "user_market_profiles"

/**
 * GET /api/wallet/info
 * 获取当前用户余额、累计收益
 */
export async function GET(request: NextRequest) {
  try {
    const userId = requireAuth(request)

    const profile = await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { id: userId })
    
    if (!profile) {
      return successResponse("获取钱包信息成功", {
        balance: "0",
        totalEarnings: "0"
      })
    }

    return successResponse("获取钱包信息成功", {
      balance: profile.balance || "0",
      totalEarnings: profile.totalEarnings || "0"
    })

  } catch (error) {
    return handleApiError(error)
  }
}
