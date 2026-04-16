import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"

export async function GET() {
  const result = await getAdminSession()
  if (!result.valid) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({ ok: true, admin: { username: result.session!.username, role: result.session!.role } })
}
