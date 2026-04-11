import { NextRequest } from "next/server"

/**
 * 验证管理员权限
 * 在实际生产环境中，这里应该检查 JWT token 或 Session
 * 当前为了方便演示，我们支持通过 x-admin-key 头部或 cookie 进行简单验证
 */
export function verifyMarketingAdmin(request: NextRequest): boolean {
  // 1. 检查环境变量中定义的 Admin Key (如果有)
  const adminKey = process.env.MARKET_ADMIN_KEY || "orbitchat-admin"
  
  // 2. 从 Header 检查
  const headerKey = request.headers.get("x-admin-key")
  if (headerKey === adminKey) return true
  
  // 3. 从 Authorization Header 检查 (Bearer token)
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    if (token === adminKey) return true
  }

  // 4. 从 Cookie 检查管理员会话
  const sessionCookie = request.cookies.get("market_admin_session")
  if (sessionCookie?.value === adminKey) return true

  // 5. 允许普通登录用户访问 (有 market_user_id 即可)
  const userCookie = request.cookies.get("market_user_id")
  if (userCookie?.value) return true

  // 如果以上检查都失败，返回 false
  return false 
}

export async function readRouteJson(request: NextRequest): Promise<any> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

/**
 * 获取当前用户 ID
 * 实际项目中应从 Session/JWT 中提取
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get("market_user_id")
  return cookie?.value || null
}

export function successJson(data: any = {}) {
  return Response.json({ success: true, ...data }, { status: 200 })
}

export function errorJson(error: any, message: string, status = 500) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[API Error] ${message}:`, error)
  return Response.json({
    success: false,
    error: errorMessage,
    message
  }, { status })
}
