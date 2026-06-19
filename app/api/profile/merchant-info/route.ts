import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/market/db-adapter"

export async function GET(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    
    // 查询用户的商家认证信息
    const profiles = await dbAdapter.loadRows("user_market_profiles", { user_id: userId })
    
    if (profiles.length > 0) {
      const profile = profiles[0]
      return Response.json({
        ok: true,
        data: profile
      })
    }
    
    return Response.json({
      ok: false,
      message: "未找到商家认证信息"
    })
  } catch (error: any) {
    console.error("[API] 获取商家信息失败:", error)
    return Response.json(
      { ok: false, message: error.message || "获取失败" },
      { status: 500 }
    )
  }
}