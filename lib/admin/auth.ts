import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"
import { createAdminSession, setAdminSessionCookie, clearAdminSessionCookie } from "./session"
import type { LoginResult } from "./types"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function adminLogin(username: string, password: string): Promise<LoginResult> {
  try {
    const sb = getSupabase()
    const { data, error } = await sb.from("admins").select("*").eq("username", username).single()
    if (error || !data) return { success: false, error: "用户名或密码错误" }
    if (data.status !== "active") return { success: false, error: "账户已被禁用" }

    const valid = await bcrypt.compare(password, data.password_hash)
    if (!valid) return { success: false, error: "用户名或密码错误" }

    await sb.from("admins").update({ last_login_at: new Date().toISOString() }).eq("id", data.id)

    const session = createAdminSession(data.id, data.username, data.role)
    await setAdminSessionCookie(session)

    return { success: true, admin: data }
  } catch (e: any) {
    console.error("[adminLogin]", e)
    return { success: false, error: "登录失败，请稍后重试" }
  }
}

export async function adminLogout(): Promise<void> {
  await clearAdminSessionCookie()
}
