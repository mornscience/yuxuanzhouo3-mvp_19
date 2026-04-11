import { NextRequest } from "next/server"
import { dbAdapter } from "./db-adapter"
import { getCurrentUser } from "./auth/service"

// 表名常量
const ACQUISITION_BLOGGERS_TABLE = "acquisition_bloggers"
const ACQUISITION_B2B_LEADS_TABLE = "acquisition_b2b_leads"
const ACQUISITION_VC_LEADS_TABLE = "acquisition_vc_leads"
const ACQUISITION_ADS_TABLE = "acquisition_ads"
const AD_PARTICIPATIONS_TABLE = "ad_participations"
const USER_MARKET_PROFILES_TABLE = "user_market_profiles"

/**
 * 从请求中获取用户ID
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  const userId = match ? decodeURIComponent(match[1]) : ""
  return userId || null
}

/**
 * 验证用户是否已登录，返回用户ID或抛出错误
 */
export function requireAuth(request: NextRequest): string {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    throw new Error("用户未登录")
  }
  return userId
}

/**
 * 获取当前用户的市场资料（用于验证商家/达人身份）
 */
export async function getUserMarketProfile(userId: string): Promise<any> {
  const result = await getCurrentUser(userId)
  if (!result.ok) {
    throw new Error(result.message)
  }
  return result.marketProfile
}

/**
 * 验证用户是否为商家（isMerchantVerified === true）
 */
export async function requireMerchant(request: NextRequest): Promise<string> {
  const userId = requireAuth(request)
  const marketProfile = await getUserMarketProfile(userId)

  if (!marketProfile.isMerchantVerified) {
    throw new Error("需要商家认证")
  }

  return userId
}

/**
 * 验证用户是否为达人（isInfluencerVerified === true）
 */
export async function requireInfluencer(request: NextRequest): Promise<string> {
  const userId = requireAuth(request)
  const marketProfile = await getUserMarketProfile(userId)

  if (!marketProfile.isInfluencerVerified) {
    throw new Error("需要达人认证")
  }

  return userId
}

/**
 * 统一API响应格式
 */
export function apiResponse(ok: boolean, message: string, data?: any) {
  return Response.json({ ok, message, data }, {
    status: ok ? 200 : (message.includes("未登录") ? 401 : 400)
  })
}

/**
 * 成功响应
 */
export function successResponse(message: string = "操作成功", data?: any) {
  return apiResponse(true, message, data)
}

/**
 * 错误响应
 */
export function errorResponse(message: string, status: number = 400) {
  return apiResponse(false, message, undefined)
}

/**
 * 处理API异常
 */
export function handleApiError(error: any) {
  console.error("[API Error]:", error)

  const errorMessage = error instanceof Error ? error.message : String(error)

  // 根据错误类型设置状态码
  let status = 400
  if (errorMessage.includes("未登录")) status = 401
  if (errorMessage.includes("认证")) status = 403

  return errorResponse(errorMessage, status)
}

/**
 * 将金额转换为数字
 */
export function parseAmount(amount: string | number): number {
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^\d.-]/g, "")) : amount
  return isNaN(num) ? 0 : num
}

/**
 * 格式化金额为字符串
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * 验证必填字段
 */
export function validateRequiredFields(body: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!body[field] || body[field].toString().trim() === "") {
      return `字段 "${field}" 为必填项`
    }
  }
  return null
}