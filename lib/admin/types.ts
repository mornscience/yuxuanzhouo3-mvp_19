export type AdminRole = "admin" | "super_admin"
export type AdminStatus = "active" | "disabled"

export interface AdminUser {
  id: string
  username: string
  password_hash?: string
  role: AdminRole
  status: AdminStatus
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface AdminSession {
  adminId: string
  username: string
  role: AdminRole
  createdAt: number
  expiresAt: number
}

export interface SessionValidationResult {
  valid: boolean
  session?: AdminSession
  error?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResult {
  success: boolean
  admin?: AdminUser
  error?: string
}
