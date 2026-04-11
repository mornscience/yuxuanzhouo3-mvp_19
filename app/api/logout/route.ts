import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "Logged out successfully." })
  
  response.cookies.delete("market_user_id")
  
  return response
}
