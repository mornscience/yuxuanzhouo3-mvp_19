import { NextRequest, NextResponse } from "next/server"
import { updatePassword } from "@/lib/auth/service"

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
    const { oldPassword, newPassword } = body

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, message: "请输入旧密码和新密码" },
        { status: 400 }
      )
    }

    const result = await updatePassword(userId, oldPassword, newPassword)

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
    console.error("[API /api/profile/update-password] 错误:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "密码更新失败" },
      { status: 500 }
    )
  }
}