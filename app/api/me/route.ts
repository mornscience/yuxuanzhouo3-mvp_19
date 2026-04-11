import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const cookieHeader = new Headers(req.headers).get("cookie") || ""
  // Parse cookie manually to avoid relying on edge/runtime cookie helpers.
  const match = cookieHeader.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  const userId = match ? decodeURIComponent(match[1]) : ""

  if (!userId) {
    return NextResponse.json({ ok: false, user: null })
  }

  return NextResponse.json({
    ok: true,
    user: { email: userId },
  })
}

