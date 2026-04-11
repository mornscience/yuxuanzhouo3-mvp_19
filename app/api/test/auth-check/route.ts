import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const cookieHeader = request.headers.get("cookie") || ""

    return NextResponse.json({
      ok: true,
      message: "认证检查完成",
      data: {
        hasUserId: !!userId,
        userId,
        cookieHeader,
        cookies: request.cookies.getAll().map((c: any) => ({ name: c.name, value: c.value }))
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      message: error.message || "检查失败",
      data: null
    }, { status: 500 })
  }
}