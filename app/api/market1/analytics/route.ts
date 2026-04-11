import { NextRequest, NextResponse } from "next/server"
import { readSessionFromRequest } from "@/lib/market1/admin-auth"
import { getAnalytics } from "@/lib/market1/analytics"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const days = request.nextUrl.searchParams.get("days") || 30
    const analytics = await getAnalytics({ days })
    return NextResponse.json({ success: true, analytics })
  } catch (error: any) {
    console.error("[market1/analytics]", error)
    return NextResponse.json({ success: false, error: error?.message || "Failed to load analytics" }, { status: 500 })
  }
}
