import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/market1/admin-auth"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  clearSessionCookie(res)
  return res
}
