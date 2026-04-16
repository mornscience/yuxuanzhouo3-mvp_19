"use server"

import { redirect } from "next/navigation"
import { adminLogin, adminLogout } from "@/lib/admin/auth"
import { requireAdminSession } from "@/lib/admin/session"

export async function adminLoginAction(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  if (!username || !password) return { success: false, error: "请输入用户名和密码" }
  return adminLogin(username, password)
}

export async function adminLogoutAction() {
  await adminLogout()
  redirect("/admin/login")
}

export async function getCurrentAdmin() {
  try {
    const session = await requireAdminSession()
    return { adminId: session.adminId, username: session.username, role: session.role }
  } catch {
    return null
  }
}
