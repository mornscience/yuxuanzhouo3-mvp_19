import { NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth/service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim()
    const password = body.password ?? ""

    const result = await loginUser(email, password)

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      ok: true,
      message: result.message,
      user: result.user
    })

    // 设置登录 Cookie (有效期 7 天)
    response.cookies.set("market_user_id", result.user.userId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
    })

    return response

  } catch (error: any) {
    console.error("[API /api/auth/login] 错误:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "登录失败" },
      { status: 500 }
    )
  }
}