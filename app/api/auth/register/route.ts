import { NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth/service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim()
    const password = body.password ?? ""
    const referralCode = body.referralCode?.trim() || undefined

    const result = await registerUser(email, password, { referralCode })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, message: result.message })

  } catch (error: any) {
    console.error("[API /api/auth/register] 错误:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "注册失败" },
      { status: 500 }
    )
  }
}