import { NextRequest, NextResponse } from "next/server"
import { readSessionFromRequest } from "@/lib/market1/admin-auth"

export async function GET(req: NextRequest) {
  const session = readSessionFromRequest(req)
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({ ok: true, username: session.username })
}
