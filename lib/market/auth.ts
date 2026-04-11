import { registerUser as registerUserNew, loginUser as loginUserNew } from "@/lib/auth/service"

/**
 * 用户注册功能（兼容旧接口）
 * 调用新的 auth service，保持相同的返回格式
 */
export async function registerUser(email: string, password: string) {
  const result = await registerUserNew(email, password)

  if (!result.ok) {
    throw new Error(result.message)
  }

  return { userId: result.userId, email }
}

/**
 * 用户登录功能（兼容旧接口）
 * 调用新的 auth service，转换为旧格式
 */
export async function loginUser(email: string, password: string) {
  const result = await loginUserNew(email, password)

  if (!result.ok) {
    throw new Error(result.message)
  }

  const user = result.user

  // 转换为旧格式
  return {
    userId: user.userId,
    email: user.email,
    role: user.role,
    nickname: user.profile?.nickname || user.marketProfile?.nickname || email.split("@")[0],
    isRealNameVerified: false, // 实名认证已注释掉，固定为 false
  }
}