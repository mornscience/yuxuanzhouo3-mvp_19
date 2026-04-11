import { NextRequest, NextResponse } from "next/server"
import { dbAdapter } from "@/lib/db-adapter"

const USERS_TABLE = "users"

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

    // 查找用户
    const user = await dbAdapter.loadSingleRow(USERS_TABLE, { _id: userId })
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "用户不存在" },
        { status: 404 }
      )
    }

    // 返回密码（明文存储，所以直接返回）
    return NextResponse.json({
      ok: true,
      password: user.password,
      message: "获取密码成功"
    })

  } catch (error: any) {
    console.error("[API /api/profile/get-password] 错误:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "获取密码失败" },
      { status: 500 }
    )
  }
}