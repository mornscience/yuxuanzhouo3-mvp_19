// Acquisition domain types — bloggers, B2B leads, VC leads, ad inventory

export interface AcquisitionBlogger {
  id: string
  userId?: string // Who created/owns this KOL record
  taskId?: string // 关联的采集任务ID
  name: string
  platform: string
  followers: string
  email: string
  homeUrl?: string // 博主主页链接
  category?: string // 领域分类
  status: string // 待联系, 已发邀约, 对接中, 已合作, 已发布
  commission: string
  cost: string
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

// 采集任务
export interface BloggerCollectTask {
  id: string
  userId: string
  taskName: string
  platform: string // 平台：抖音,小红书,YouTube
  keyword: string // 领域关键词
  maxLimit: number // 上限1000
  totalCollect: number // 已抓多少
  status: string // waiting, running, paused, completed, failed
  createdAt: string
  updatedAt: string
}

// 采集临时数据
export interface BloggerCollectTemp {
  id: string
  taskId: string
  userId: string
  name: string // 博主昵称
  platform: string // 平台
  followers: string // 粉丝
  email: string // 邮箱
  homeUrl: string // 主页
  category: string // 领域
  isValid: boolean // 是否有效
  isSync: boolean // 是否已同步到线索池
  createdAt: string
  updatedAt: string
}

// 邮件模板
export interface BloggerEmailTemplate {
  id: string
  userId: string
  title: string
  subject: string
  content: string
  createdAt: string
}

// 邮件发送日志
export interface BloggerEmailSendLog {
  id: string
  userId: string
  bloggerId: string
  templateId: string
  email: string
  subject: string
  content: string
  status: string // success, failed
  createdAt: string
}

// 合作确认
export interface BloggerCooperation {
  id: string
  userId: string
  bloggerId: string
  bloggerName: string
  platform: string
  email: string
  articleTemplateId: string
  publishType: string // now, scheduled
  publishTime: string | null
  channels: string // 频道IDs，逗号分隔
  status: string // wait_publish, publishing, published, failed
  createdAt: string
  updatedAt: string
}

// 发布频道
export interface PublishChannel {
  id: string
  userId: string
  name: string
  platform: string
  account: string
  token: string
  status: string // active, inactive
  createdAt: string
}

// 文章模板
export interface ArticleTemplate {
  id: string
  userId: string
  title: string
  content: string
  images: string // 图片URLs，逗号分隔
  tags: string // 标签，逗号分隔
  createdAt: string
  updatedAt: string
}

// 发布任务
export interface PublishTask {
  id: string
  userId: string
  coopId: string
  bloggerId: string
  articleId: string
  channelId: string
  channelName: string
  status: string // waiting, publishing, published, failed
  postUrl: string // 发布后的链接
  createdAt: string
  updatedAt: string
}

export interface AcquisitionB2BLead {
  id: string
  userId?: string // Who created/owns this lead
  name: string
  region: string
  contact: string
  email: string
  source: string // 手工录入, BD引荐, 官网注册
  status: string // 初步接触, 跟进中, 合同拟定, 已转化, 已流失
  estValue: string
  type: "follow" | "publish" // 线索类型：follow=我跟进的客户, publish=我发布的需求
  isPublic?: boolean // 是否发布到线索池（仅type=publish时有效）
  publishAt?: string // 发布时间
  cooperationCount?: number // 收到的合作申请数
  description?: string // 需求描述（仅type=publish时使用）
  createdAt: string
  updatedAt: string
}

export interface AcquisitionVCLead {
  id: string
  userId?: string // Who created/owns this connection
  name: string
  region: string
  contact: string
  email: string
  source: string // 手工录入, BD引荐
  status: string // 待联系, 初步沟通, 尽调, 投资 (follow类型) / 已发布/未发布 (publish类型)
  focus: string
  type: "follow" | "publish" // 线索类型：follow=我跟进的VC机构, publish=我发布的融资需求
  isPublic?: boolean // 是否发布到VC线索池（仅type=publish时有效）
  publishAt?: string // 发布时间
  cooperationCount?: number // 收到的对接申请数
  fundingAmount?: string // 融资金额（仅type=publish时使用）
  fundingStage?: string // 融资阶段（仅type=publish时使用）
  description?: string // 需求描述（仅type=publish时使用）
  createdAt: string
  updatedAt: string
}

export interface AcquisitionAd {
  id: string
  _id?: string
  userId?: string // Who published this ad (Merchant)
  brand: string
  type: string // 视频广告, 互动广告, 横幅图片
  duration: string
  reward: string
  status: string // 待审核, 投放中, 已暂停, 已下架
  views: string
  videoUrl?: string // 广告视频地址
  createdAt: string
  updatedAt: string
}

// User Profile related to the market/acquisition system
export interface UserMarketProfile {
  id: string
  email?: string // 用户邮箱
  nickname?: string
  avatar?: string
  fullName?: string // 真实姓名
  idNumber?: string // 身份证号
  isRealNameVerified: boolean
  isInfluencerVerified: boolean
  isMerchantVerified: boolean
  isRealInfluencer: boolean // Effective delivery >= 1
  isRealMerchant: boolean // Ad participation >= 1 or spend >= 50
  totalEarnings: string
  balance: string
  adViewsCount: number // For "Real User" status (>= 3)
  merchant_verify_status?: "pending" | "approved" | "rejected" | null
  merchant_reject_reason?: string | null
  // 商家认证相关字段
  company_name?: string // 公司名称
  brand_name?: string // 品牌名称
  contact_person?: string // 联系人
  contact_phone?: string // 联系电话
  credit_code?: string // 统一社会信用代码
  industry?: string // 所属行业
  business_license_url?: string // 营业执照URL
  // 企业数字画像字段
  product_categories?: string // 产品品类（JSON字符串）
  capacity?: string // 产能规模
  price_range?: string // 价格区间
  quality_certifications?: string // 质量认证（JSON字符串）
  other_tags?: string // 其他标签（JSON字符串）
  digital_portrait_updated_at?: string // 数字画像更新时间
}

// Participation records for ads
export interface AdParticipation {
  id: string
  userId: string
  adId: string
  status: string // 进行中, 已完成
  rewardEarned: string
  completedAt?: string
}

export interface ScaffoldProject {
  id: string
  userId: string
  projectName: string
  template: string
  zipUrl: string
  status: string
  createdAt: string
}

export interface CooperationApplication {
  id: string
  leadId: string // 关联的B2B线索ID
  leadOwnerId: string // 线索发布者ID
  applicantId: string // 申请人ID
  applicantName: string // 申请人/公司名称
  applicantContact: string // 申请人联系方式
  applicantEmail: string // 申请人邮箱
  message?: string // 申请留言
  status: "pending" | "approved" | "rejected" // 申请状态
  createdAt: string
  updatedAt: string
}

// User notification for verification results
export interface UserNotification {
  id: string
  userId: string
  type: "merchant_approved" | "merchant_rejected" | "influencer_approved" | "influencer_rejected"
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface AcquisitionBootstrapData {
  bloggers: AcquisitionBlogger[]
  allBloggers?: AcquisitionBlogger[]
  b2bLeads: AcquisitionB2BLead[]
  vcLeads: AcquisitionVCLead[] // 保留兼容旧代码
  vcFollowLeads?: AcquisitionVCLead[] // 跟进型 VC 线索
  vcPublishLeads?: AcquisitionVCLead[] // 发布型融资需求
  ads: AcquisitionAd[]
  profile?: UserMarketProfile
  bloggerProfile?: AcquisitionBlogger
  participations?: AdParticipation[]
  scaffoldProjects?: ScaffoldProject[]
  cooperations?: any[]
}

// ==========================================
// 企业采集相关类型
// ==========================================

// 企业采集任务
export interface EnterpriseCollectTask {
  id: string
  userId: string
  taskName: string
  platform: string // 来源平台
  keyword: string // 行业关键词
  maxLimit: number // 上限1000
  totalCollect: number // 已抓多少
  status: string // waiting, running, paused, completed, failed
  createdAt: string
  updatedAt: string
}

// 企业采集临时数据
export interface EnterpriseCollectTemp {
  id: string
  taskId: string
  userId: string
  name: string // 企业名称
  region: string // 地区
  contact: string // 联系人
  email: string // 邮箱
  source: string // 来源
  isValid: boolean // 是否有效
  isSync: boolean // 是否已同步到线索池
  createdAt: string
  updatedAt: string
}

// 企业邮件模板
export interface EnterpriseEmailTemplate {
  id: string
  userId: string
  title: string
  subject: string
  content: string
  createdAt: string
}

// 企业邮件发送日志
export interface EnterpriseEmailSendLog {
  id: string
  userId: string
  enterpriseId: string
  templateId: string
  email: string
  subject: string
  content: string
  status: string // success, failed
  createdAt: string
}

// 企业合作确认
export interface EnterpriseCooperation {
  id: string
  userId: string
  enterpriseId: string
  enterpriseName: string
  contact: string
  email: string
  status: string // wait_service, in_service, completed
  createdAt: string
  updatedAt: string
}

// ==========================================
// VC 采集相关类型
// ==========================================

// VC 采集任务
export interface VCCollectTask {
  id: string
  userId: string
  taskName: string
  platform: string // 来源平台
  keyword: string // 投资赛道关键词
  maxLimit: number // 上限1000
  totalCollect: number // 已抓多少
  status: string // waiting, running, paused, completed, failed
  createdAt: string
  updatedAt: string
}

// VC 采集临时数据
export interface VCCollectTemp {
  id: string
  taskId: string
  userId: string
  name: string // VC 机构名称
  region: string // 地区
  contact: string // 联系人
  email: string // 邮箱
  focus: string // 投资赛道
  isValid: boolean // 是否有效
  isSync: boolean // 是否已同步到线索池
  createdAt: string
  updatedAt: string
}

// VC 邮件模板
export interface VCEmailTemplate {
  id: string
  userId: string
  title: string
  subject: string
  content: string
  createdAt: string
}

// VC 邮件发送日志
export interface VCEmailSendLog {
  id: string
  userId: string
  vcId: string
  templateId: string
  email: string
  subject: string
  content: string
  status: string // success, failed
  createdAt: string
}

// VC 合作确认
export interface VCCooperation {
  id: string
  userId: string
  vcId: string
  institution: string // 机构名称
  contact: string
  email: string
  status: string // wait_feedback, in_discussion, completed
  createdAt: string
  updatedAt: string
}
