import { NextRequest, NextResponse } from "next/server"
import { updateUserProfile } from "@/lib/auth/service"

export async function POST(request: NextRequest) {
  try {
    // 从 cookie 中获取用户 ID
    const cookieHeader = request.headers.get("cookie") || ""
    const match = cookieHeader.match(/(?:^|;\s*)market_user_id=([^;]+)/)
    const userId = match ? decodeURIComponent(match[1]) : ""

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "用户未登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nickname, phone } = body

    // 只更新昵称和手机号，忽略头像字段
    const result = await updateUserProfile(userId, { nickname, phone })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: result.message
    })

  } catch (error: any) {
    console.error("[API] update-base 错误:", error.message)
    return NextResponse.json(
      { ok: false, message: error.message || "更新基础资料失败" },
      { status: 500 }
    )
  }
}