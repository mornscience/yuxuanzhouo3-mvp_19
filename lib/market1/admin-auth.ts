import { createHmac, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"

export const MARKET1_SESSION_COOKIE = "market1_admin_session"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function getSecret() {
  return process.env.MARKET_ADMIN_JWT_SECRET || process.env.ADMIN_SESSION_SECRET || "market1-dev-secret"
}

function getCredentials() {
  return {
    username: String(process.env.ADMIN_USERNAME || "admin").trim(),
    password: String(process.env.ADMIN_PASSWORD || "Zyx!213416").trim(),
  }
}

export function verifyLogin(input: { username?: string; password?: string }) {
  const { username, password } = getCredentials()
  return String(input.username || "").trim() === username && String(input.password || "").trim() === password
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url")
}

export function createSessionToken(username: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  const payload = Buffer.from(JSON.stringify({ sub: username, role: "market1_admin", exp })).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function decodeSessionToken(token?: string | null): { username: string } | null {
  if (!token) return null
  try {
    const [payload, signature] = String(token).split(".")
    if (!payload || !signature) return null
    const expected = sign(payload)
    if (Buffer.from(signature).length !== Buffer.from(expected).length) return null
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub?: string; role?: string; exp?: number }
    if (data.role !== "market1_admin") return null
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null
    return { username: String(data.sub || "admin") }
  } catch { return null }
}

export function attachSessionCookie(res: NextResponse, token: string) {
  res.cookies.set({ name: MARKET1_SESSION_COOKIE, value: token, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE_SECONDS })
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({ name: MARKET1_SESSION_COOKIE, value: "", httpOnly: true, path: "/", maxAge: 0 })
}

export function readSessionFromRequest(req: NextRequest) {
  return decodeSessionToken(req.cookies.get(MARKET1_SESSION_COOKIE)?.value)
}
