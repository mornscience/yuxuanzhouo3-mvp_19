import type { AdminSession, SessionValidationResult } from "./types"

// 统一的 cookies 获取函数，支持 Server Actions 和 Route Handlers
async function getCookies() {
  try {
    // 尝试异步调用（Server Actions）
    const { cookies: cookiesFn } = await import("next/headers")
    return cookiesFn()
  } catch {
    // 回退到同步调用（Route Handlers）
    const { cookies: cookiesFn } = require("next/headers")
    return cookiesFn()
  }
}

const COOKIE_NAME = "admin_session"
const SESSION_EXPIRY = 24 * 60 * 60 // 24h

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET
  if (!s) throw new Error("ADMIN_SESSION_SECRET not set")
  return s
}

export function createAdminSession(adminId: string, username: string, role: "admin" | "super_admin"): AdminSession {
  const now = Math.floor(Date.now() / 1000)
  return { adminId, username, role, createdAt: now, expiresAt: now + SESSION_EXPIRY }
}

export function serializeSession(session: AdminSession): string {
  const secret = getSecret()
  const b64 = Buffer.from(JSON.stringify(session)).toString("base64")
  const sig = Buffer.from(`${b64}.${secret}`).toString("base64").slice(0, 16)
  return `${b64}.${sig}`
}

export function deserializeSession(serialized: string): AdminSession | null {
  try {
    const parts = serialized.split(".")
    if (parts.length !== 2) return null
    const [b64, sig] = parts
    const secret = getSecret()
    const expected = Buffer.from(`${b64}.${secret}`).toString("base64").slice(0, 16)
    if (sig !== expected) return null
    return JSON.parse(Buffer.from(b64, "base64").toString("utf-8")) as AdminSession
  } catch {
    return null
  }
}

export async function setAdminSessionCookie(session: AdminSession): Promise<void> {
  const store = await getCookies()
  store.set(COOKIE_NAME, serializeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY,
  })
}

export async function getAdminSession(): Promise<SessionValidationResult> {
  try {
    const store = await getCookies()
    const cookie = store.get(COOKIE_NAME)
    if (!cookie) return { valid: false, error: "未登录" }
    const session = deserializeSession(cookie.value)
    if (!session) return { valid: false, error: "会话无效" }
    if (session.expiresAt < Math.floor(Date.now() / 1000)) return { valid: false, error: "会话已过期" }
    return { valid: true, session }
  } catch {
    return { valid: false, error: "获取会话失败" }
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const result = await getAdminSession()
  if (!result.valid || !result.session) throw new Error(result.error || "需要管理员权限")
  return result.session
}

export async function clearAdminSessionCookie(): Promise<void> {
  const store = await getCookies()
  store.delete(COOKIE_NAME)
}
