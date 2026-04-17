import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { decodeSessionToken, MARKET1_SESSION_COOKIE } from "@/lib/market1/admin-auth"

export async function requireSession() {
  const cookieStore = cookies()
  const token = cookieStore.get(MARKET1_SESSION_COOKIE)?.value || null
  const session = decodeSessionToken(token)
  if (!session) redirect("/market1/login")
  return session
}
