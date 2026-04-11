import { NextRequest, NextResponse } from "next/server"
import { verifyLogin, createSessionToken, attachSessionCookie } from "@/lib/market1/admin-auth"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (!verifyLogin(body)) {
    return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 })
  }
  const token = createSessionToken(String(body.username || "admin"))
  const res = NextResponse.json({ success: true })
  attachSessionCookie(res, token)
  return res
}
