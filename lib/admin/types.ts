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

// ==================== AI 相关类型 ====================

/**
 * AI 区域
 */
export type AiRegion = 'CN' | 'INTL'

/**
 * AI 语言
 */
export type AiLanguage = 'zh-CN' | 'en-US'

/**
 * AI 提供商
 */
export type AiProvider = 'aliyun-bailian' | 'aliyun-wanx-image' | 'aliyun-wanx-video' | 'gemini' | 'openai'

/**
 * AI 资产类型
 */
export type AiAssetType = 'image' | 'video' | 'analysis'

/**
 * AI 资产
 */
export interface AiAsset {
  id: string
  jobId: string
  type: AiAssetType
  asset_type?: string
  url: string
  public_url?: string
  size?: number
  duration?: number // 视频时长（秒）
  metadata?: Record<string, any>
  created_at: string
}

/**
 * AI 生成任务状态
 */
export type AiGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'blocked'

/**
 * AI 生成任务
 */
export interface AiGenerationJob {
  id: string
  region: AiRegion
  language: AiLanguage
  status: AiGenerationStatus
  type: 'analysis' | 'poster' | 'video'
  brief: Record<string, any>
  output_payload?: any
  progress?: number // 0-100
  error?: string
  error_message?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

/**
 * AI 营销资料
 */
export interface AiMarketingProfile {
  product_name: string
  product_summary: string
  core_features: string[]
  marketing_angles: string[]
  target_audience: string[]
  key_benefits: string[]
  brand_voice: string
  visual_style: string
}

// ==================== 广告相关类型 ====================

export type AdType = 'image' | 'video'
export type AdPosition = 'top' | 'bottom' | 'left' | 'right' | 'bottom-left' | 'bottom-right' | 'sidebar'
export type AdStatus = 'active' | 'inactive'

export interface Advertisement {
  id: string
  title: string
  type: AdType
  position: AdPosition
  fileUrl: string
  linkUrl?: string
  priority: number
  status: AdStatus
  startDate?: string
  endDate?: string
  fileSize?: number
  impression_count: number
  click_count: number
  created_at: string
  updated_at: string
}

export interface CreateAdData {
  title: string
  type: AdType
  position: AdPosition
  fileUrl: string
  linkUrl?: string
  priority?: number
  status?: AdStatus
  startDate?: string
  endDate?: string
  fileSize?: number
  impression_count?: number
  click_count?: number
}

export interface UpdateAdData {
  title?: string
  type?: AdType
  position?: AdPosition
  fileUrl?: string
  linkUrl?: string
  priority?: number
  status?: AdStatus
  startDate?: string
  endDate?: string
  fileSize?: number
}

export interface AdStats {
  total: number
  active: number
  inactive: number
  totalImpressions: number
  totalClicks: number
  ctr: number // click-through rate
}

export interface AdFilters {
  status?: AdStatus
  type?: AdType
  position?: AdPosition
  search?: string
  limit?: number
  offset?: number
}

// ==================== 分页类型 ====================

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
