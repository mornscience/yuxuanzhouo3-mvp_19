import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/service"
import { getUserIdFromRequest } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    // 从 cookie 中获取用户 ID（使用统一函数）
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "用户未登录" },
        { status: 401 }
      )
    }

    const result = await getCurrentUser(userId)

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: result.message === "用户不存在" ? 404 : 401 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      data: {
        user: result.user,
        profile: result.profile,
        marketProfile: result.marketProfile
      }
    })

  } catch (error: any) {
    console.error("[API /api/auth/me] 错误:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "获取用户信息失败" },
      { status: 500 }
    )
  }
}