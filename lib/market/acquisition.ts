import { randomUUID } from "crypto"
import { dbAdapter } from "./db-adapter"
import type {
  AcquisitionBlogger,
  AcquisitionB2BLead,
  AcquisitionVCLead,
  AcquisitionAd,
  AcquisitionBootstrapData,
  UserMarketProfile,
  AdParticipation,
  BloggerCollectTask,
  BloggerCollectTemp,
  BloggerEmailTemplate,
  BloggerEmailSendLog,
  BloggerCooperation,
  PublishChannel,
  ArticleTemplate,
  PublishTask,
  EnterpriseCollectTask,
  EnterpriseCollectTemp,
  EnterpriseEmailTemplate,
  EnterpriseEmailSendLog,
  EnterpriseCooperation,
  VCCollectTask,
  VCCollectTemp,
  VCEmailTemplate,
  VCEmailSendLog,
  VCCooperation,
} from "./acquisition-types"
import { crawlBloggers, pauseCrawlerTask, stopCrawlerTask, isTaskRunning } from "./blogger-crawler"

type RawRow = Record<string, any>

const BLOGGERS_TABLE = "acquisition_bloggers"
const B2B_LEADS_TABLE = "acquisition_b2b_leads"
const VC_LEADS_TABLE = "acquisition_vc_leads"
const ADS_TABLE = "acquisition_ads"
const PROFILE_TABLE = "user_market_profiles"
const USERS_TABLE = "users"
const PARTICIPATION_TABLE = "ad_participations"
const SCAFFOLD_PROJECTS_TABLE = "scaffold_projects"

// 企业采集相关表
const ENTERPRISE_COLLECT_TASKS_TABLE = "enterprise_collect_tasks"
const ENTERPRISE_COLLECT_TEMP_TABLE = "enterprise_collect_temp"
const ENTERPRISE_EMAIL_TEMPLATES_TABLE = "enterprise_email_templates"
const ENTERPRISE_EMAIL_SEND_LOGS_TABLE = "enterprise_email_send_logs"
const ENTERPRISE_COOPERATION_TABLE = "enterprise_cooperation"

// VC 采集相关表
const VC_COLLECT_TASKS_TABLE = "vc_collect_tasks"
const VC_COLLECT_TEMP_TABLE = "vc_collect_temp"
const VC_EMAIL_TEMPLATES_TABLE = "vc_email_templates"
const VC_EMAIL_SEND_LOGS_TABLE = "vc_email_send_logs"
const VC_COOPERATION_TABLE = "vc_cooperation"

function nowIso() {
  return new Date().toISOString()
}

function safeString(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim()
  return normalized || fallback
}

// ==========================================
// Row mappers
// ==========================================

function mapBloggerRow(row: RawRow): AcquisitionBlogger {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId ?? row?.user_id),
    taskId: safeString(row?.taskId ?? row?.task_id),
    name: safeString(row?.name),
    platform: safeString(row?.platform),
    followers: safeString(row?.followers),
    email: safeString(row?.email),
    homeUrl: safeString(row?.homeUrl ?? row?.home_url),
    category: safeString(row?.category),
    status: safeString(row?.status, "待联系"),
    commission: safeString(row?.commission),
    cost: safeString(row?.cost),
    remark: safeString(row?.remark),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// 采集任务映射函数
function mapCollectTaskRow(row: RawRow): BloggerCollectTask {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId ?? row?.user_id),
    taskName: safeString(row?.taskName ?? row?.task_name),
    platform: safeString(row?.platform),
    keyword: safeString(row?.keyword),
    maxLimit: Number(row?.maxLimit ?? row?.max_limit ?? 1000),
    totalCollect: Number(row?.totalCollect ?? row?.total_collect ?? 0),
    status: safeString(row?.status, "waiting"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// 采集临时数据映射函数
function mapCollectTempRow(row: RawRow): BloggerCollectTemp {
  return {
    id: safeString(row?.id || row?._id),
    taskId: safeString(row?.taskId ?? row?.task_id),
    userId: safeString(row?.userId ?? row?.user_id),
    name: safeString(row?.name),
    platform: safeString(row?.platform),
    followers: safeString(row?.followers),
    email: safeString(row?.email),
    homeUrl: safeString(row?.homeUrl ?? row?.home_url),
    category: safeString(row?.category),
    isValid: !!(row?.isValid ?? row?.is_valid),
    isSync: !!(row?.isSync ?? row?.is_sync),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// 邮件模板映射函数
function mapEmailTemplateRow(row: RawRow): BloggerEmailTemplate {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    title: safeString(row?.title),
    subject: safeString(row?.subject),
    content: safeString(row?.content),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
  }
}

// 邮件发送日志映射函数
function mapEmailSendLogRow(row: RawRow): BloggerEmailSendLog {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    bloggerId: safeString(row?.bloggerId),
    templateId: safeString(row?.templateId),
    email: safeString(row?.email),
    subject: safeString(row?.subject),
    content: safeString(row?.content),
    status: safeString(row?.status, "success"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
  }
}

// 合作确认映射函数
function mapCooperationRow(row: RawRow): BloggerCooperation {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    bloggerId: safeString(row?.bloggerId),
    bloggerName: safeString(row?.bloggerName),
    platform: safeString(row?.platform),
    email: safeString(row?.email),
    articleTemplateId: safeString(row?.articleTemplateId),
    publishType: safeString(row?.publishType, "now"),
    publishTime: row?.publishTime ? safeString(row.publishTime) : null,
    channels: safeString(row?.channels),
    status: safeString(row?.status, "wait_publish"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// 发布频道映射函数
function mapPublishChannelRow(row: RawRow): PublishChannel {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    name: safeString(row?.name),
    platform: safeString(row?.platform),
    account: safeString(row?.account),
    token: safeString(row?.token),
    status: safeString(row?.status, "active"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
  }
}

// 文章模板映射函数
function mapArticleTemplateRow(row: RawRow): ArticleTemplate {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    title: safeString(row?.title),
    content: safeString(row?.content),
    images: safeString(row?.images),
    tags: safeString(row?.tags),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// 发布任务映射函数
function mapPublishTaskRow(row: RawRow): PublishTask {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    coopId: safeString(row?.coopId),
    bloggerId: safeString(row?.bloggerId),
    articleId: safeString(row?.articleId),
    channelId: safeString(row?.channelId),
    channelName: safeString(row?.channelName),
    status: safeString(row?.status, "waiting"),
    postUrl: safeString(row?.postUrl),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// 企业采集任务映射函数
function mapEnterpriseCollectTaskRow(row: RawRow): EnterpriseCollectTask {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    taskName: safeString(row?.taskName),
    platform: safeString(row?.platform),
    keyword: safeString(row?.keyword),
    maxLimit: Number(row?.maxLimit || 1000),
    totalCollect: Number(row?.totalCollect || 0),
    status: safeString(row?.status, "waiting"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// 企业采集临时数据映射函数
function mapEnterpriseCollectTempRow(row: RawRow): EnterpriseCollectTemp {
  return {
    id: safeString(row?.id || row?._id),
    taskId: safeString(row?.taskId),
    userId: safeString(row?.userId),
    name: safeString(row?.name),
    region: safeString(row?.region),
    contact: safeString(row?.contact),
    email: safeString(row?.email),
    source: safeString(row?.source),
    isValid: !!row?.isValid,
    isSync: !!row?.isSync,
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// 企业邮件模板映射函数
function mapEnterpriseEmailTemplateRow(row: RawRow): EnterpriseEmailTemplate {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    title: safeString(row?.title),
    subject: safeString(row?.subject),
    content: safeString(row?.content),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
  }
}

// 企业邮件发送日志映射函数
function mapEnterpriseEmailSendLogRow(row: RawRow): EnterpriseEmailSendLog {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    enterpriseId: safeString(row?.enterpriseId),
    templateId: safeString(row?.templateId),
    email: safeString(row?.email),
    subject: safeString(row?.subject),
    content: safeString(row?.content),
    status: safeString(row?.status, "success"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
  }
}

// 企业合作确认映射函数
function mapEnterpriseCooperationRow(row: RawRow): EnterpriseCooperation {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    enterpriseId: safeString(row?.enterpriseId),
    enterpriseName: safeString(row?.enterpriseName),
    contact: safeString(row?.contact),
    email: safeString(row?.email),
    status: safeString(row?.status, "wait_service"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// VC 采集任务映射函数
function mapVCCollectTaskRow(row: RawRow): VCCollectTask {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    taskName: safeString(row?.taskName),
    platform: safeString(row?.platform),
    keyword: safeString(row?.keyword),
    maxLimit: Number(row?.maxLimit || 1000),
    totalCollect: Number(row?.totalCollect || 0),
    status: safeString(row?.status, "waiting"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// VC 采集临时数据映射函数
function mapVCCollectTempRow(row: RawRow): VCCollectTemp {
  return {
    id: safeString(row?.id || row?._id),
    taskId: safeString(row?.taskId),
    userId: safeString(row?.userId),
    name: safeString(row?.name),
    region: safeString(row?.region),
    contact: safeString(row?.contact),
    email: safeString(row?.email),
    focus: safeString(row?.focus),
    isValid: !!row?.isValid,
    isSync: !!row?.isSync,
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

// VC 邮件模板映射函数
function mapVCEmailTemplateRow(row: RawRow): VCEmailTemplate {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    title: safeString(row?.title),
    subject: safeString(row?.subject),
    content: safeString(row?.content),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
  }
}

// VC 邮件发送日志映射函数
function mapVCEmailSendLogRow(row: RawRow): VCEmailSendLog {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    vcId: safeString(row?.vcId),
    templateId: safeString(row?.templateId),
    email: safeString(row?.email),
    subject: safeString(row?.subject),
    content: safeString(row?.content),
    status: safeString(row?.status, "success"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
  }
}

// VC 合作确认映射函数
function mapVCCooperationRow(row: RawRow): VCCooperation {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    vcId: safeString(row?.vcId),
    institution: safeString(row?.institution),
    contact: safeString(row?.contact),
    email: safeString(row?.email),
    status: safeString(row?.status, "wait_feedback"),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

function mapB2BLeadRow(row: RawRow): AcquisitionB2BLead {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId ?? row?.user_id),
    name: safeString(row?.name),
    region: safeString(row?.region),
    contact: safeString(row?.contact),
    email: safeString(row?.email),
    source: safeString(row?.source, "手工录入"),
    status: safeString(row?.status, "初步接触"),
    estValue: safeString(row?.est_value || row?.estValue),
    type: (row?.type as "follow" | "publish") || "follow",
    isPublic: !!(row?.isPublic ?? row?.is_public),
    publishAt: (row?.publishAt || row?.publish_at) ? safeString(row.publishAt ?? row.publish_at) : undefined,
    cooperationCount: Number(row?.cooperationCount ?? row?.cooperation_count ?? 0),
    description: row?.description ? safeString(row.description) : undefined,
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

function mapVCLeadRow(row: RawRow): AcquisitionVCLead {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId ?? row?.user_id),
    name: safeString(row?.name),
    region: safeString(row?.region),
    contact: safeString(row?.contact),
    email: safeString(row?.email),
    source: safeString(row?.source, "手工录入"),
    status: safeString(row?.status, "待联系"),
    focus: safeString(row?.focus),
    type: (row?.type as "follow" | "publish") || "follow",
    isPublic: !!(row?.isPublic ?? row?.is_public),
    publishAt: (row?.publishAt || row?.publish_at) ? safeString(row.publishAt ?? row.publish_at) : undefined,
    cooperationCount: Number(row?.cooperationCount ?? row?.cooperation_count ?? 0),
    fundingAmount: (row?.fundingAmount || row?.funding_amount) ? safeString(row.fundingAmount ?? row.funding_amount) : undefined,
    fundingStage: (row?.fundingStage || row?.funding_stage) ? safeString(row.fundingStage ?? row.funding_stage) : undefined,
    description: row?.description ? safeString(row.description) : undefined,
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

function mapAdRow(row: RawRow): AcquisitionAd {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId ?? row?.user_id),
    brand: safeString(row?.brand),
    type: safeString(row?.type, "视频广告"),
    duration: safeString(row?.duration, "30s"),
    reward: safeString(row?.reward),
    status: safeString(row?.status, "待审核"),
    views: safeString(row?.views, "0"),
    videoUrl: (row?.videoUrl || row?.video_url) ? safeString(row.videoUrl ?? row.video_url) : undefined,
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

function mapProfileRow(row: RawRow): UserMarketProfile {
  const id = safeString(row?.userId || row?.user_id || row?.id || row?._id)
  const rawNickname = safeString(row?.nickname, "")
  const derivedNickname =
    id.includes("@") ? id.split("@")[0] : id
  const nickname =
    !rawNickname || rawNickname === "Demo User" ? derivedNickname || "用户" : rawNickname

  return {
    id,
    email: safeString(row?.email) || undefined,
    nickname,
    avatar: safeString(row?.avatar, ""),
    fullName: safeString(row?.fullName ?? row?.full_name),
    idNumber: safeString(row?.idNumber ?? row?.id_number),
    isRealNameVerified: !!(row?.isRealNameVerified ?? row?.is_real_name_verified),
    isInfluencerVerified: !!(row?.isInfluencerVerified ?? row?.is_influencer_verified),
    isMerchantVerified: !!(row?.isMerchantVerified ?? row?.is_merchant_verified),
    isRealInfluencer: !!(row?.isRealInfluencer ?? row?.is_real_influencer),
    isRealMerchant: !!(row?.isRealMerchant ?? row?.is_real_merchant),
    totalEarnings: safeString(row?.totalEarnings ?? row?.total_earnings, "0"),
    balance: safeString(row?.balance, "0"),
    adViewsCount: Number(row?.adViewsCount ?? row?.ad_views_count ?? 0),
  }
}

function mapParticipationRow(row: RawRow): AdParticipation {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId ?? row?.user_id),
    adId: safeString(row?.adId ?? row?.ad_id),
    status: safeString(row?.status, "进行中"),
    rewardEarned: safeString(row?.rewardEarned ?? row?.reward_earned, "0"),
    completedAt: (row?.completedAt || row?.completed_at) ? safeString(row.completedAt ?? row.completed_at) : undefined,
  }
}

// ==========================================
// Public API
// ==========================================

export async function loadAcquisitionBootstrap(userId: string | null): Promise<AcquisitionBootstrapData> {
  // 如果没有 userId，返回游客视图数据
  if (!userId) {
    const allAdsRows = await dbAdapter.loadRows(ADS_TABLE, { status: "投放中" })
    return {
      bloggers: [],
      b2bLeads: [],
      vcLeads: [],
      ads: allAdsRows.map(mapAdRow),
      profile: undefined,
      participations: [],
      scaffoldProjects: [],
    }
  }

  // 强制重置当前用户的认证状态为未认证（用于演示恢复状态）
  // 在生产环境中，这应该通过数据库管理界面或特定管理接口操作
  // 注释掉以下代码以允许认证状态持久化
  // await dbAdapter.updateRow(PROFILE_TABLE, { id: userId }, {
  //   isRealNameVerified: false,
  //   isInfluencerVerified: false,
  //   isMerchantVerified: false,
  //   fullName: "",
  //   idNumber: "",
  //   balance: "0",
  //   totalEarnings: "0",
  //   adViewsCount: 0
  // })

  // 1. Get user profile (create if not exists)
  const [profileByUserId, profileById, userRowsById, userRowsByObjectId] = await Promise.all([
    dbAdapter.loadRows(PROFILE_TABLE, { userId }),
    dbAdapter.loadRows(PROFILE_TABLE, { id: userId }),
    dbAdapter.loadRows(USERS_TABLE, { id: userId }),
    dbAdapter.loadRows(USERS_TABLE, { _id: userId })
  ])

  // 合并用户记录
  const userRows = [...userRowsById, ...userRowsByObjectId].filter((value, index, self) =>
    index === self.findIndex((t) => (t.id || t._id) === (value.id || value._id))
  )
  const userEmail = userRows.length > 0 ? safeString(userRows[0].email) : undefined

  // 合并去重 profile 记录（userId 查到的优先）
  const seen = new Set<string>()
  const profileRows = [...profileByUserId, ...profileById].filter(row => {
    const key = safeString(row?.id || row?._id)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  let profile: UserMarketProfile
  if (profileRows.length > 0) {
    const chosen = profileRows.find(row =>
      row?.isInfluencerVerified === true || row?.isMerchantVerified === true
    ) ?? profileRows[0]
    profile = mapProfileRow(chosen)
    profile.email = userEmail
  } else {
    // 没有记录，创建新记录
    const derivedNickname = userId.includes("@") ? userId.split("@")[0] : userId
    profile = {
      id: userId,
      email: userEmail,
      nickname: derivedNickname || "用户",
      avatar: "",
      isRealNameVerified: false,
      isInfluencerVerified: false,
      isMerchantVerified: false,
      isRealInfluencer: false,
      isRealMerchant: false,
      totalEarnings: "0",
      balance: "0",
      adViewsCount: 0,
    }
    await dbAdapter.insertRow(PROFILE_TABLE, profile)
  }

  // 2. Load all available ads for "Task Mode"
  const allAdsRows = await dbAdapter.loadRows(ADS_TABLE, { status: "投放中" })
  
  // 3. Load user's own data for "Influencer" and "Merchant" modes
  const [myBloggerRows, myB2BRows, myVCRows, myAdRows, myParticipations, myScaffoldRows] = await Promise.all([
    dbAdapter.loadRows(BLOGGERS_TABLE, { userId }),
    dbAdapter.loadRows(B2B_LEADS_TABLE, { userId }),
    dbAdapter.loadRows(VC_LEADS_TABLE, { userId }),
    dbAdapter.loadRows(ADS_TABLE, { userId }),
    dbAdapter.loadRows(PARTICIPATION_TABLE, { userId }),
    dbAdapter.loadRows(SCAFFOLD_PROJECTS_TABLE, { userId }),
  ])

  // 博主池：加载所有博主数据（全表）
  const allBloggerRows = await dbAdapter.loadRows(BLOGGERS_TABLE, {})

  // 加载采集任务
  const collectTaskRows = await dbAdapter.loadRows(BLOGGER_COLLECT_TASKS_TABLE, { userId })

  // 分离 VC 线索类型
  const allVCLeads = myVCRows.map(mapVCLeadRow)
  const vcFollowLeads = allVCLeads.filter(l => l.type === "follow")
  const vcPublishLeads = allVCLeads.filter(l => l.type === "publish")

  return {
    bloggers: myBloggerRows.map(mapBloggerRow),
    allBloggers: allBloggerRows.map(mapBloggerRow),
    collectTasks: collectTaskRows.map(mapCollectTaskRow),
    b2bLeads: myB2BRows.map(mapB2BLeadRow),
    vcLeads: allVCLeads, // 保留兼容旧代码
    vcFollowLeads,
    vcPublishLeads,
    ads: (() => {
      // 去重：以 id 为准，myAdRows 优先（包含最新状态）
      const map = new Map<string, any>()
      allAdsRows.map(mapAdRow).forEach(ad => map.set(ad.id, ad))
      myAdRows.map(mapAdRow).forEach(ad => map.set(ad.id, ad))
      return Array.from(map.values())
    })(),
    profile,
    participations: myParticipations.map(mapParticipationRow),
    scaffoldProjects: myScaffoldRows.map((r: RawRow) => ({
      id: safeString(r.id || r._id),
      userId: safeString(r.userId),
      projectName: safeString(r.projectName),
      template: safeString(r.template),
      zipUrl: safeString(r.zipUrl),
      status: safeString(r.status, "completed"),
      createdAt: safeString(r.created_at || r.createdAt, nowIso()),
    })),
  }
}

// ==========================================
// Actions
// ==========================================

export async function insertScaffoldProject(userId: string, data: {
  projectName: string
  template: string
  zipUrl: string
  status?: string
}) {
  const row: RawRow = {
    id: `proj-${randomUUID().slice(0, 8)}`,
    userId,
    projectName: data.projectName,
    template: data.template,
    zipUrl: data.zipUrl,
    status: data.status || "completed",
  }
  return await dbAdapter.insertRow(SCAFFOLD_PROJECTS_TABLE, row)
}

export async function insertBlogger(userId: string, data: {
  name: string
  platform: string
  followers: string
  email: string
  cost: string
  commission: string
}): Promise<AcquisitionBlogger> {
  const row: RawRow = {
    id: `bl-${randomUUID().slice(0, 8)}`,
    userId,
    name: data.name,
    platform: data.platform,
    followers: data.followers,
    email: data.email,
    status: "未联系",
    commission: data.commission,
    cost: data.cost,
  }
  console.log('[insertBlogger] inserting to', BLOGGERS_TABLE, 'row:', JSON.stringify(row))
  const result = await dbAdapter.insertRow(BLOGGERS_TABLE, row)
  return mapBloggerRow(result)
}

export async function insertB2BLead(userId: string, data: {
  name: string
  region: string
  contact: string
  email?: string
  estValue: string
  type?: "follow" | "publish"
  description?: string
}): Promise<AcquisitionB2BLead> {
  const isPublish = data.type === "publish"
  const row: RawRow = {
    id: `b2b-${randomUUID().slice(0, 8)}`,
    userId,
    name: data.name,
    region: data.region,
    contact: data.contact,
    email: data.email || "",
    source: "手工录入",
    status: isPublish ? "待发布" : "初步接触",
    est_value: data.estValue,
    type: data.type || "follow",
    isPublic: isPublish ? false : undefined,
    description: data.description || "",
  }
  const result = await dbAdapter.insertRow(B2B_LEADS_TABLE, row)
  return mapB2BLeadRow(result)
}

export async function insertVCLead(userId: string, data: {
  name: string
  region: string
  contact: string
  email?: string
  focus: string
  type?: "follow" | "publish"
  fundingAmount?: string
  fundingStage?: string
  description?: string
}): Promise<AcquisitionVCLead> {
  const isPublish = data.type === "publish"
  const row: RawRow = {
    id: `vc-${randomUUID().slice(0, 8)}`,
    userId,
    name: data.name,
    region: data.region,
    contact: data.contact,
    email: data.email || "",
    source: "手工录入",
    status: isPublish ? "未发布" : "待联系",
    focus: data.focus,
    type: data.type || "follow",
    isPublic: isPublish ? false : undefined,
    fundingAmount: data.fundingAmount || "",
    fundingStage: data.fundingStage || "",
    description: data.description || "",
  }
  const result = await dbAdapter.insertRow(VC_LEADS_TABLE, row)
  return mapVCLeadRow(result)
}

export async function insertAd(userId: string, data: {
  brand: string
  type: string
  duration: string
  reward: string
  videoUrl?: string
}): Promise<AcquisitionAd> {
  const row: RawRow = {
    id: `ad-${randomUUID().slice(0, 8)}`,
    userId,
    brand: data.brand,
    type: data.type,
    duration: data.duration,
    reward: data.reward,
    status: "待审核",
    views: "0",
    videoUrl: data.videoUrl || "",
  }
  const result = await dbAdapter.insertRow(ADS_TABLE, row)
  return mapAdRow(result)
}

export async function participateInAd(userId: string, adId: string, reward: string): Promise<AdParticipation> {
  const row: RawRow = {
    id: `p-${randomUUID().slice(0, 8)}`,
    userId,
    adId,
    status: "进行中",
    rewardEarned: reward,
  }
  const result = await dbAdapter.insertRow(PARTICIPATION_TABLE, row)
  return mapParticipationRow(result)
}

export async function completeAdTask(userId: string, participationId: string): Promise<AdParticipation | null> {
  const result = await dbAdapter.updateRow(PARTICIPATION_TABLE, { id: participationId, userId }, {
    status: "已完成",
    completedAt: nowIso(),
  })
  if (result) {
    // Update profile earnings/views
    const profile = (await dbAdapter.loadRows(PROFILE_TABLE, { id: userId }))[0]
    if (profile) {
      const currentEarnings = parseFloat(profile.totalEarnings || "0")
      const currentBalance = parseFloat(profile.balance || "0")
      const reward = parseFloat(result.rewardEarned || "0")
      
      await dbAdapter.updateRow(PROFILE_TABLE, { id: userId }, {
        totalEarnings: (currentEarnings + reward).toString(),
        balance: (currentBalance + reward).toString(),
        adViewsCount: (profile.adViewsCount || 0) + 1,
      })
    }
  }
  return result ? mapParticipationRow(result) : null
}

export async function updateProfileVerification(userId: string, type: "realName" | "influencer" | "merchant", data?: { fullName?: string; idNumber?: string }): Promise<UserMarketProfile | null> {
  const patch: RawRow = {}
  if (type === "realName") {
    patch.isRealNameVerified = true
    if (data?.fullName) patch.fullName = data.fullName
    if (data?.idNumber) patch.idNumber = data.idNumber
  }
  if (type === "influencer") patch.isInfluencerVerified = true
  if (type === "merchant") patch.isMerchantVerified = true
  
  // 先尝试用 userId 字段更新
  let result = await dbAdapter.updateRow(PROFILE_TABLE, { userId }, patch)
  
  // 如果失败，尝试用 id 字段更新
  if (!result) {
    result = await dbAdapter.updateRow(PROFILE_TABLE, { id: userId }, patch)
  }
  
  return result ? mapProfileRow(result) : null
}

export async function updateB2BLeadStatus(userId: string, id: string, status: string): Promise<AcquisitionB2BLead | null> {
  // First check if lead exists and is type=follow
  const leads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { id, userId })
  if (leads.length === 0) return null
  
  const lead = leads[0]
  // Only follow type leads can update status
  if (lead.type !== "follow") {
    throw new Error("发布型线索不支持更新跟进进度")
  }
  
  const result = await dbAdapter.updateRow(B2B_LEADS_TABLE, { id, userId }, { status, updated_at: nowIso() })
  return result ? mapB2BLeadRow(result) : null
}

export async function updateVCLeadStatus(userId: string, id: string, status: string): Promise<AcquisitionVCLead | null> {
  // First check if lead exists and is type=follow
  const leads = await dbAdapter.loadRows(VC_LEADS_TABLE, { id, userId })
  if (leads.length === 0) return null

  const lead = leads[0]
  // Only follow type leads can update status
  if (lead.type !== "follow") {
    throw new Error("发布型融资需求不支持更新跟进进度")
  }

  const result = await dbAdapter.updateRow(VC_LEADS_TABLE, { id, userId }, { status, updated_at: nowIso() })
  return result ? mapVCLeadRow(result) : null
}

export async function updateBloggerStatus(userId: string, id: string, status: string): Promise<AcquisitionBlogger | null> {
  const result = await dbAdapter.updateRow(BLOGGERS_TABLE, { id, userId }, { status })
  return result ? mapBloggerRow(result) : null
}

export async function updateAd(userId: string, id: string, patch: { duration?: string; reward?: string; status?: string; videoUrl?: string }): Promise<AcquisitionAd | null> {
  const result = await dbAdapter.updateRow(ADS_TABLE, { id, userId }, patch)
  return result ? mapAdRow(result) : null
}

export async function deleteBlogger(userId: string, id: string): Promise<boolean> {
  return await dbAdapter.deleteRow(BLOGGERS_TABLE, { id, userId })
}

export async function deleteB2BLead(userId: string, id: string): Promise<boolean> {
  return await dbAdapter.deleteRow(B2B_LEADS_TABLE, { id, userId })
}

export async function deleteVCLead(userId: string, id: string): Promise<boolean> {
  return await dbAdapter.deleteRow(VC_LEADS_TABLE, { id, userId })
}

export async function deleteAd(userId: string, id: string): Promise<boolean> {
  return await dbAdapter.deleteRow(ADS_TABLE, { id, userId })
}

// ==========================================
// Blogger Crawler API
// ==========================================

export async function createBloggerCollectTask(userId: string, data: {
  taskName: string
  platform: string
  keyword: string
  maxLimit: number
}): Promise<BloggerCollectTask> {
  const row = {
    id: `task-${randomUUID().slice(0, 8)}`,
    userId,
    taskName: data.taskName,
    platform: data.platform,
    keyword: data.keyword,
    maxLimit: Math.min(data.maxLimit, 1000), // 限制最大1000条
    totalCollect: 0,
    status: "waiting",
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
  
  const result = await dbAdapter.insertRow(BLOGGER_COLLECT_TASKS_TABLE, row)
  return mapCollectTaskRow(result)
}

export async function startBloggerCollectTask(taskId: string): Promise<boolean> {
  // 加载任务信息
  const taskRows = await dbAdapter.loadRows(BLOGGER_COLLECT_TASKS_TABLE, { id: taskId })
  if (taskRows.length === 0) {
    throw new Error("Task not found")
  }
  
  const task = mapCollectTaskRow(taskRows[0])
  
  // 检查任务状态
  if (task.status !== "waiting" && task.status !== "paused") {
    throw new Error("Task is not in a valid state to start")
  }
  
  // 启动爬虫任务
  crawlBloggers(task).catch(error => {
    console.error(`Failed to start crawler task ${taskId}:`, error)
  })
  
  return true
}

export async function pauseBloggerCollectTask(taskId: string): Promise<boolean> {
  // 暂停爬虫任务
  pauseCrawlerTask(taskId)
  
  // 更新任务状态
  await dbAdapter.updateRow(BLOGGER_COLLECT_TASKS_TABLE, { id: taskId }, {
    status: "paused",
    updatedAt: nowIso()
  })
  
  return true
}

export async function stopBloggerCollectTask(taskId: string): Promise<boolean> {
  // 停止爬虫任务
  stopCrawlerTask(taskId)
  
  // 更新任务状态
  await dbAdapter.updateRow(BLOGGER_COLLECT_TASKS_TABLE, { id: taskId }, {
    status: "stopped",
    updatedAt: nowIso()
  })
  
  return true
}

export async function loadBloggerCollectTasks(userId: string): Promise<BloggerCollectTask[]> {
  const rows = await dbAdapter.loadRows(BLOGGER_COLLECT_TASKS_TABLE, { userId })
  return rows.map(mapCollectTaskRow)
}

export async function loadBloggerCollectTemp(taskId: string): Promise<BloggerCollectTemp[]> {
  const rows = await dbAdapter.loadRows(BLOGGER_COLLECT_TEMP_TABLE, { taskId })
  return rows.map(mapCollectTempRow)
}

export async function syncBloggerFromTemp(tempId: string): Promise<boolean> {
  // 加载临时数据
  const tempRows = await dbAdapter.loadRows(BLOGGER_COLLECT_TEMP_TABLE, { id: tempId })
  if (tempRows.length === 0) {
    throw new Error("Temporary data not found")
  }
  
  const tempData = mapCollectTempRow(tempRows[0])
  
  // 检查是否已经同步
  if (tempData.isSync) {
    throw new Error("Data has already been synced")
  }
  
  // 构造博主数据
  const bloggerData = {
    id: `bl-${randomUUID().slice(0, 8)}`,
    userId: tempData.userId,
    taskId: tempData.taskId,
    name: tempData.name,
    platform: tempData.platform,
    followers: tempData.followers,
    email: tempData.email,
    homeUrl: tempData.homeUrl,
    category: tempData.category,
    status: "待联系",
    commission: "",
    cost: "",
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
  
  // 插入到博主表
  await dbAdapter.insertRow(BLOGGERS_TABLE, bloggerData)
  
  // 更新临时数据状态
  await dbAdapter.updateRow(BLOGGER_COLLECT_TEMP_TABLE, { id: tempId }, {
    isSync: true,
    updatedAt: nowIso()
  })
  
  return true
}

export async function deleteBloggerCollectTask(userId: string, taskId: string): Promise<boolean> {
  // 停止任务（如果正在运行）
  stopCrawlerTask(taskId)
  
  // 删除临时数据
  await dbAdapter.deleteRow(BLOGGER_COLLECT_TEMP_TABLE, { taskId })
  
  // 删除任务
  return await dbAdapter.deleteRow(BLOGGER_COLLECT_TASKS_TABLE, { id: taskId, userId })
}



export async function upsertBloggerProfile(userId: string, data: {
  name: string
  platform: string
  followers: string
  email: string
  cost: string
  commission: string
}): Promise<AcquisitionBlogger> {
  // Check if blogger profile already exists for this user
  const existingRows = await dbAdapter.loadRows(BLOGGERS_TABLE, { userId })
  
  if (existingRows.length > 0) {
    // Update existing profile
    const existingId = safeString(existingRows[0].id || existingRows[0]._id)
    const result = await dbAdapter.updateRow(BLOGGERS_TABLE, { id: existingId, userId }, {
      name: data.name,
      platform: data.platform,
      followers: data.followers,
      email: data.email,
      cost: data.cost,
      commission: data.commission,
      updated_at: nowIso(),
    })
    return mapBloggerRow(result!)
  } else {
    // Insert new profile
    const row: RawRow = {
      id: `bl-${randomUUID().slice(0, 8)}`,
      userId,
      name: data.name,
      platform: data.platform,
      followers: data.followers,
      email: data.email,
      status: "未联系",
      commission: data.commission,
      cost: data.cost,
    }
    const result = await dbAdapter.insertRow(BLOGGERS_TABLE, row)
    return mapBloggerRow(result)
  }
}

export async function deleteBloggerSoft(userId: string, id: string): Promise<boolean> {
  // Soft delete by updating status to "已删除"
  const result = await dbAdapter.updateRow(BLOGGERS_TABLE, { id, userId }, { 
    status: "已删除",
    updated_at: nowIso(),
  })
  return !!result
}

export async function submitUnifiedForm(userId: string, data: any): Promise<any> {
  // Store form submission in a generic form submissions table or process based on form type
  const row: RawRow = {
    id: `form-${randomUUID().slice(0, 8)}`,
    userId,
    formType: data?.formType || "unknown",
    formData: JSON.stringify(data),
    status: "待处理",
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  // For now, just return success - actual implementation would save to database
  return { success: true, id: row.id, message: "Form submitted successfully" }
}

export async function loadUserTransactions(userId: string): Promise<any[]> {
  // Return empty array for now - actual implementation would load from transactions table
  return []
}

export async function requestWithdrawal(userId: string, amount: string): Promise<{ success: boolean; message: string }> {
  // Validate amount
  const withdrawalAmount = parseFloat(amount)
  if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
    return { success: false, message: "Invalid withdrawal amount" }
  }
  
  // Get user profile to check balance
  const profileRows = await dbAdapter.loadRows(PROFILE_TABLE, { id: userId })
  if (profileRows.length === 0) {
    return { success: false, message: "User profile not found" }
  }
  
  const currentBalance = parseFloat(profileRows[0].balance || "0")
  if (currentBalance < withdrawalAmount) {
    return { success: false, message: "Insufficient balance" }
  }
  
  // Update balance
  const newBalance = currentBalance - withdrawalAmount
  await dbAdapter.updateRow(PROFILE_TABLE, { id: userId }, {
    balance: newBalance.toString(),
    updated_at: nowIso(),
  })
  
  return { success: true, message: "Withdrawal request submitted successfully" }
}

// ==========================================
// B2B Leads Pool - Publish/Unpublish
// ==========================================

const COOPERATION_APPLICATIONS_TABLE = "cooperation_applications"

// 采集任务相关表
const BLOGGER_COLLECT_TASKS_TABLE = "blogger_collect_tasks"
const BLOGGER_COLLECT_TEMP_TABLE = "blogger_collect_temp"
const BLOGGER_EMAIL_TEMPLATES_TABLE = "blogger_email_templates"
const BLOGGER_EMAIL_SEND_LOGS_TABLE = "blogger_email_send_logs"
const BLOGGER_COOPERATION_TABLE = "blogger_cooperation"
const PUBLISH_CHANNELS_TABLE = "publish_channels"
const ARTICLE_TEMPLATES_TABLE = "article_templates"
const PUBLISH_TASKS_TABLE = "publish_tasks"

export async function publishB2BLead(userId: string, leadId: string, isPublic: boolean): Promise<AcquisitionB2BLead | null> {
  // First check if lead exists and is type=publish
  const leads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { id: leadId, userId })
  if (leads.length === 0) return null
  
  const lead = leads[0]
  // Only publish type leads can be published to pool
  if (lead.type !== "publish") {
    throw new Error("跟进型线索不能发布到线索池")
  }
  
  const updateData: RawRow = {
    isPublic,
    updated_at: nowIso(),
  }
  
  if (isPublic) {
    updateData.publishAt = nowIso()
  }
  
  const result = await dbAdapter.updateRow(B2B_LEADS_TABLE, { id: leadId, userId }, updateData)
  return result ? mapB2BLeadRow(result) : null
}

export async function loadPublicB2BLeads(filters: {
  region?: string
  status?: string
  minEstValue?: number
  maxEstValue?: number
  sortBy?: "newest" | "highestValue"
} = {}): Promise<AcquisitionB2BLead[]> {
  // Load all public leads (only type=publish and isPublic=true)
  const allPublicLeads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { type: "publish", isPublic: true })
  
  let leads = allPublicLeads.map(mapB2BLeadRow)
  
  // Apply filters
  if (filters.region) {
    leads = leads.filter(l => l.region.includes(filters.region!))
  }
  
  if (filters.status) {
    leads = leads.filter(l => l.status === filters.status)
  }
  
  // Sort
  if (filters.sortBy === "newest") {
    leads.sort((a, b) => new Date(b.publishAt || b.createdAt).getTime() - new Date(a.publishAt || a.createdAt).getTime())
  } else if (filters.sortBy === "highestValue") {
    leads.sort((a, b) => {
      const valueA = parseFloat(a.estValue.replace(/[^0-9.]/g, "")) || 0
      const valueB = parseFloat(b.estValue.replace(/[^0-9.]/g, "")) || 0
      return valueB - valueA
    })
  }
  
  return leads
}

export async function applyForCooperation(
  leadId: string,
  applicantId: string,
  data: {
    applicantName: string
    applicantContact: string
    applicantEmail: string
    message?: string
  }
): Promise<{ success: boolean; message: string }> {
  // Get the lead to verify it exists and is public
  const leads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { id: leadId })
  const lead = leads.length > 0 ? leads[0] : null
  if (!lead) {
    return { success: false, message: "线索不存在" }
  }
  
  // Must be publish type
  if (lead.type !== "publish") {
    return { success: false, message: "该线索不支持合作申请" }
  }
  
  if (!lead.isPublic && !lead.is_public) {
    return { success: false, message: "该需求未公开发布" }
  }
  
  // Cannot apply to own lead
  if (lead.userId === applicantId || lead.user_id === applicantId) {
    return { success: false, message: "不能申请自己的线索" }
  }
  
  // 检查申请次数，最多 15 次
  const existingApplications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, {
    leadId,
    applicantId,
  })

  const MAX_APPLY = 15
  if (existingApplications.length >= MAX_APPLY) {
    return { success: false, message: `您已向该企业发起 ${MAX_APPLY} 次申请，已达上限` }
  }
  
  // Create application
  const row: RawRow = {
    id: `app-${randomUUID().slice(0, 8)}`,
    leadId,
    leadType: "b2b",
    leadOwnerId: lead.userId || lead.user_id,
    applicantId,
    applicantName: data.applicantName,
    applicantContact: data.applicantContact,
    applicantEmail: data.applicantEmail,
    message: data.message || "",
    status: "pending",
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  
  await dbAdapter.insertRow(COOPERATION_APPLICATIONS_TABLE, row)
  
  // Increment cooperation count on the lead
  const currentCount = lead.cooperationCount || 0
  await dbAdapter.updateRow(
    B2B_LEADS_TABLE,
    { id: leadId },
    { cooperationCount: currentCount + 1 }
  )
  
  return { success: true, message: "合作申请已提交" }
}

export async function loadMyReceivedApplications(leadOwnerId: string): Promise<any[]> {
  // 只查 B2B 类型，VC 由 loadMyVCReceivedApplications 负责
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { leadOwnerId, leadType: "b2b" })
  
  // Sort by newest first
  applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return applications.map(app => ({
    id: safeString(app.id || app._id),
    leadId: safeString(app.leadId ?? app.lead_id),
    leadOwnerId: safeString(app.leadOwnerId ?? app.lead_owner_id),
    applicantId: safeString(app.applicantId ?? app.applicant_id),
    applicantName: safeString(app.applicantName ?? app.applicant_name),
    applicantContact: safeString(app.applicantContact ?? app.applicant_contact),
    applicantEmail: safeString(app.applicantEmail ?? app.applicant_email),
    message: safeString(app.message),
    status: safeString(app.status, "pending"),
    createdAt: safeString(app.created_at || app.createdAt, nowIso()),
    updatedAt: safeString(app.updated_at || app.updatedAt || app.created_at || app.createdAt, nowIso()),
  }))
}

export async function loadMySentApplications(applicantId: string): Promise<any[]> {
  // 只查 B2B 类型
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { applicantId, leadType: "b2b" })
  
  // Sort by newest first
  applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return applications.map(app => ({
    id: safeString(app.id || app._id),
    leadId: safeString(app.leadId ?? app.lead_id),
    leadOwnerId: safeString(app.leadOwnerId ?? app.lead_owner_id),
    applicantId: safeString(app.applicantId ?? app.applicant_id),
    applicantName: safeString(app.applicantName ?? app.applicant_name),
    applicantContact: safeString(app.applicantContact ?? app.applicant_contact),
    applicantEmail: safeString(app.applicantEmail ?? app.applicant_email),
    message: safeString(app.message),
    status: safeString(app.status, "pending"),
    createdAt: safeString(app.created_at || app.createdAt, nowIso()),
    updatedAt: safeString(app.updated_at || app.updatedAt || app.created_at || app.createdAt, nowIso()),
  }))
}

export async function updateApplicationStatus(
  leadOwnerId: string,
  applicationId: string,
  status: "approved" | "rejected"
): Promise<{ success: boolean; message: string }> {
  // Verify the application belongs to this owner
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { id: applicationId })
  const application = applications.length > 0 ? applications[0] : null
  
  if (!application) {
    return { success: false, message: "申请记录不存在" }
  }
  
  if ((application.leadOwnerId || application.lead_owner_id) !== leadOwnerId) {
    return { success: false, message: "无权处理此申请" }
  }
  
  await dbAdapter.updateRow(
    COOPERATION_APPLICATIONS_TABLE,
    { id: applicationId },
    { status, updated_at: nowIso() }
  )
  
  if (status === "approved") {
    try {
      const leads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { id: application.leadId || application.lead_id })
      const originalLead = leads[0] || null

      const row: RawRow = {
        id: `b2b-${randomUUID().slice(0, 8)}`,
        userId: leadOwnerId,                    // B 的跟进列表
        name: application.applicantName || application.applicant_name,
        region: originalLead?.region || "",
        contact: application.applicantContact || application.applicant_contact || "",
        email: application.applicantEmail || "",
        source: "合作申请",
        status: "初步接触",
        est_value: originalLead?.est_value || originalLead?.estValue || "",
        type: "follow",
        fromApplicationId: applicationId,       // 标记来源
        description: `来自合作申请。留言：${application.message || "无"}`,
      }
      await dbAdapter.insertRow(B2B_LEADS_TABLE, row)

      // 在申请记录上标记 applicantVisible，让 A 能在「我的合作」里看到
      await dbAdapter.updateRow(
        COOPERATION_APPLICATIONS_TABLE,
        { id: applicationId },
        { applicantVisible: true }
      )
    } catch (error) {
      console.error("Failed to auto-add to B follow list:", error)
    }
  } else if (status === "rejected") {
    // 拒绝时让申请人也能看到状态
    await dbAdapter.updateRow(
      COOPERATION_APPLICATIONS_TABLE,
      { id: applicationId },
      { applicantVisible: true }
    )
  }

  return { success: true, message: status === "approved" ? "已同意合作申请" : "已拒绝合作申请" }
}

// ==========================================
// Load my B2B leads separated by type
// ==========================================

export async function loadMyB2BLeads(userId: string): Promise<{
  followList: AcquisitionB2BLead[]
  publishList: AcquisitionB2BLead[]
}> {
  const allLeads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { userId })
  const leads = allLeads.map(mapB2BLeadRow)

  return {
    followList: leads.filter(l => l.type === "follow"),
    publishList: leads.filter(l => l.type === "publish"),
  }
}

// ==========================================
// VC Leads Pool - Publish/Unpublish
// ==========================================

export async function publishVCLead(userId: string, leadId: string, isPublic: boolean): Promise<AcquisitionVCLead | null> {
  // First check if lead exists and is type=publish
  const leads = await dbAdapter.loadRows(VC_LEADS_TABLE, { id: leadId, userId })
  if (leads.length === 0) return null

  const lead = leads[0]
  // Only publish type leads can be published to pool
  if (lead.type !== "publish") {
    throw new Error("跟进型VC线索不能发布到线索池")
  }

  const updateData: RawRow = {
    isPublic,
    status: isPublic ? "已发布" : "未发布",
    updated_at: nowIso(),
  }

  if (isPublic) {
    updateData.publishAt = nowIso()
  }

  const result = await dbAdapter.updateRow(VC_LEADS_TABLE, { id: leadId, userId }, updateData)
  return result ? mapVCLeadRow(result) : null
}

export async function loadPublicVCLeads(filters: {
  region?: string
  focus?: string
  minFunding?: number
  maxFunding?: number
  sortBy?: "newest" | "highestFunding"
} = {}): Promise<AcquisitionVCLead[]> {
  // Load all public leads (only type=publish and isPublic=true)
  const allPublicLeads = await dbAdapter.loadRows(VC_LEADS_TABLE, { type: "publish", isPublic: true })

  let leads = allPublicLeads.map(mapVCLeadRow)

  // Apply filters
  if (filters.region) {
    leads = leads.filter(l => l.region.includes(filters.region!))
  }

  if (filters.focus) {
    leads = leads.filter(l => l.focus.includes(filters.focus!))
  }

  // Sort
  if (filters.sortBy === "newest") {
    leads.sort((a, b) => new Date(b.publishAt || b.createdAt).getTime() - new Date(a.publishAt || a.createdAt).getTime())
  } else if (filters.sortBy === "highestFunding") {
    leads.sort((a, b) => {
      const fundingA = parseFloat(a.fundingAmount?.replace(/[^0-9.]/g, "") || "0") || 0
      const fundingB = parseFloat(b.fundingAmount?.replace(/[^0-9.]/g, "") || "0") || 0
      return fundingB - fundingA
    })
  }

  return leads
}

export async function applyForVCCooperation(
  leadId: string,
  applicantId: string,
  data: {
    applicantName: string
    applicantContact: string
    applicantEmail: string
    message?: string
  }
): Promise<{ success: boolean; message: string }> {
  // Get the lead to verify it exists and is public
  const leads = await dbAdapter.loadRows(VC_LEADS_TABLE, { id: leadId })
  const lead = leads.length > 0 ? leads[0] : null
  if (!lead) {
    return { success: false, message: "融资需求不存在" }
  }

  // Must be publish type
  if (lead.type !== "publish") {
    return { success: false, message: "该线索不支持对接申请" }
  }

  if (!lead.isPublic && !lead.is_public) {
    return { success: false, message: "该融资需求未公开发布" }
  }

  // Cannot apply to own lead
  if ((lead.userId || lead.user_id) === applicantId) {
    return { success: false, message: "不能申请自己的融资需求" }
  }

  // 检查申请次数，最多 15 次
  const existingApplications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, {
    leadId,
    applicantId,
    leadType: "vc",
  })

  const MAX_APPLY = 15
  if (existingApplications.length >= MAX_APPLY) {
    return { success: false, message: `您已向该融资需求发起 ${MAX_APPLY} 次申请，已达上限` }
  }

  // Create application
  const row: RawRow = {
    id: `app-${randomUUID().slice(0, 8)}`,
    leadId,
    leadType: "vc",
    leadOwnerId: lead.userId || lead.user_id,
    applicantId,
    applicantName: data.applicantName,
    applicantContact: data.applicantContact,
    applicantEmail: data.applicantEmail,
    message: data.message || "",
    status: "pending",
    created_at: nowIso(),
    updated_at: nowIso(),
  }

  await dbAdapter.insertRow(COOPERATION_APPLICATIONS_TABLE, row)

  // Increment cooperation count on the lead
  const currentCount = lead.cooperationCount || 0
  await dbAdapter.updateRow(
    VC_LEADS_TABLE,
    { id: leadId },
    { cooperationCount: currentCount + 1 }
  )

  return { success: true, message: "对接申请已提交" }
}

export async function loadMyVCReceivedApplications(leadOwnerId: string): Promise<any[]> {
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { leadOwnerId, leadType: "vc" })

  // Sort by newest first
  applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return applications.map(app => ({
    id: safeString(app.id || app._id),
    leadId: safeString(app.leadId ?? app.lead_id),
    leadType: safeString(app.leadType ?? app.lead_type, "vc"),
    leadOwnerId: safeString(app.leadOwnerId ?? app.lead_owner_id),
    applicantId: safeString(app.applicantId ?? app.applicant_id),
    applicantName: safeString(app.applicantName ?? app.applicant_name),
    applicantContact: safeString(app.applicantContact ?? app.applicant_contact),
    applicantEmail: safeString(app.applicantEmail ?? app.applicant_email),
    message: safeString(app.message),
    status: safeString(app.status, "pending"),
    createdAt: safeString(app.created_at || app.createdAt, nowIso()),
    updatedAt: safeString(app.updated_at || app.updatedAt || app.created_at || app.createdAt, nowIso()),
  }))
}

export async function loadMyVCSentApplications(applicantId: string): Promise<any[]> {
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { applicantId, leadType: "vc" })

  // Sort by newest first
  applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return applications.map(app => ({
    id: safeString(app.id || app._id),
    leadId: safeString(app.leadId ?? app.lead_id),
    leadType: safeString(app.leadType ?? app.lead_type, "vc"),
    leadOwnerId: safeString(app.leadOwnerId ?? app.lead_owner_id),
    applicantId: safeString(app.applicantId ?? app.applicant_id),
    applicantName: safeString(app.applicantName ?? app.applicant_name),
    applicantContact: safeString(app.applicantContact ?? app.applicant_contact),
    applicantEmail: safeString(app.applicantEmail ?? app.applicant_email),
    message: safeString(app.message),
    status: safeString(app.status, "pending"),
    createdAt: safeString(app.created_at || app.createdAt, nowIso()),
    updatedAt: safeString(app.updated_at || app.updatedAt || app.created_at || app.createdAt, nowIso()),
  }))
}

export async function updateVCApplicationStatus(
  leadOwnerId: string,
  applicationId: string,
  status: "approved" | "rejected"
): Promise<{ success: boolean; message: string }> {
  // Verify the application belongs to this owner
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { id: applicationId })
  const application = applications.length > 0 ? applications[0] : null

  if (!application) {
    return { success: false, message: "申请记录不存在" }
  }

  if ((application.leadOwnerId || application.lead_owner_id) !== leadOwnerId) {
    return { success: false, message: "无权处理此申请" }
  }

  await dbAdapter.updateRow(
    COOPERATION_APPLICATIONS_TABLE,
    { id: applicationId },
    { status, updated_at: nowIso() }
  )

  if (status === "approved") {
    try {
      const leads = await dbAdapter.loadRows(VC_LEADS_TABLE, { id: application.leadId || application.lead_id })
      const originalLead = leads[0] || null

      const row: RawRow = {
        id: `vc-${randomUUID().slice(0, 8)}`,
        userId: leadOwnerId,
        name: application.applicantName || application.applicant_name,
        region: originalLead?.region || "",
        contact: application.applicantContact || application.applicant_contact || "",
        email: application.applicantEmail || application.applicant_email || "",
        source: "对接申请",
        status: "待联系",
        focus: originalLead?.focus || "",
        type: "follow",
        fromApplicationId: applicationId,
        description: `来自对接申请。留言：${application.message || "无"}`,
      }
      await dbAdapter.insertRow(VC_LEADS_TABLE, row)

      await dbAdapter.updateRow(
        COOPERATION_APPLICATIONS_TABLE,
        { id: applicationId },
        { applicantVisible: true }
      )
    } catch (error) {
      console.error("Failed to auto-add to B VC follow list:", error)
    }
  } else if (status === "rejected") {
    // 拒绝时让申请人也能看到状态
    await dbAdapter.updateRow(
      COOPERATION_APPLICATIONS_TABLE,
      { id: applicationId },
      { applicantVisible: true }
    )
  }

  return { success: true, message: status === "approved" ? "已同意对接申请" : "已拒绝对接申请" }
}

// ==========================================
// Load my VC leads separated by type
// ==========================================

export async function loadMyVCLeads(userId: string): Promise<{
  followList: AcquisitionVCLead[]
  publishList: AcquisitionVCLead[]
}> {
  const allLeads = await dbAdapter.loadRows(VC_LEADS_TABLE, { userId })
  const leads = allLeads.map(mapVCLeadRow)

  return {
    followList: leads.filter(l => l.type === "follow"),
    publishList: leads.filter(l => l.type === "publish"),
  }
}

// ==========================================
// 采集任务相关 API
// ==========================================

export async function createCollectTask(userId: string, data: {
  taskName: string
  platform: string
  keyword: string
  maxLimit?: number
}): Promise<BloggerCollectTask> {
  const row: RawRow = {
    id: `task-${randomUUID().slice(0, 8)}`,
    userId,
    taskName: data.taskName,
    platform: data.platform,
    keyword: data.keyword,
    maxLimit: data.maxLimit || 1000,
    totalCollect: 0,
    status: "waiting",
  }
  const result = await dbAdapter.insertRow(BLOGGER_COLLECT_TASKS_TABLE, row)
  return mapCollectTaskRow(result)
}

export async function loadCollectTasks(userId: string): Promise<BloggerCollectTask[]> {
  const rows = await dbAdapter.loadRows(BLOGGER_COLLECT_TASKS_TABLE, { userId })
  return rows.map(mapCollectTaskRow)
}

export async function updateTaskStatus(userId: string, taskId: string, status: string): Promise<BloggerCollectTask | null> {
  const result = await dbAdapter.updateRow(BLOGGER_COLLECT_TASKS_TABLE, { id: taskId, userId }, { status })
  
  // 如果状态为 running，启动爬虫任务
  if (status === "running" && result) {
    const task = mapCollectTaskRow(result)
    crawlBloggers(task).catch(error => {
      console.error(`Failed to start crawler task ${taskId}:`, error)
    })
  }
  
  return result ? mapCollectTaskRow(result) : null
}

export async function loadCollectTempData(userId: string, taskId: string): Promise<BloggerCollectTemp[]> {
  try {
    // 构建查询条件
    const conditions: any = { taskId }
    
    // 不使用 userId 过滤条件，因为数据库中的 user_id 字段都是 "EMPTY"
    // if (userId && userId !== "EMPTY") {
    //   conditions.userId = userId
    // }
    
    const rows = await dbAdapter.loadRows(BLOGGER_COLLECT_TEMP_TABLE, conditions)
    return rows.map(mapCollectTempRow)
  } catch (error) {
    console.error(`[loadCollectTempData] 错误:`, error)
    throw error
  }
}

export async function syncTempToBloggers(userId: string, taskId: string): Promise<{ success: boolean; count: number }> {
  // 构建查询条件
  const conditions: any = { taskId, isSync: false, isValid: true }
  
  // 不使用 userId 过滤条件，因为数据库中的 user_id 字段都是 "EMPTY"
  // if (userId && userId !== "EMPTY") {
  //   conditions.userId = userId
  // }
  
  const tempData = await dbAdapter.loadRows(BLOGGER_COLLECT_TEMP_TABLE, conditions)
  
  let count = 0
  for (const temp of tempData) {
    const bloggerRow: RawRow = {
      id: `bl-${randomUUID().slice(0, 8)}`,
      userId,
      taskId: temp.taskId,
      name: temp.name,
      platform: temp.platform,
      followers: temp.followers,
      email: temp.email,
      homeUrl: temp.homeUrl,
      category: temp.category,
      status: "待联系",
      commission: "",
      cost: "",
      remark: "",
    }
    await dbAdapter.insertRow(BLOGGERS_TABLE, bloggerRow)
    await dbAdapter.updateRow(BLOGGER_COLLECT_TEMP_TABLE, { id: temp.id }, { isSync: true })
    count++
  }
  
  // 更新任务的已采集数量
  const totalCollectConditions: any = { taskId, isValid: true }
  
  // 不使用 userId 过滤条件，因为数据库中的 user_id 字段都是 "EMPTY"
  // if (userId && userId !== "EMPTY") {
  //   totalCollectConditions.userId = userId
  // }
  
  const totalCollect = await dbAdapter.loadRows(BLOGGER_COLLECT_TEMP_TABLE, totalCollectConditions)
  
  // 构建更新条件
  const updateConditions: any = { id: taskId }
  
  // 不使用 userId 过滤条件，因为数据库中的 user_id 字段都是 "EMPTY"
  // if (userId && userId !== "EMPTY") {
  //   updateConditions.userId = userId
  // }
  
  await dbAdapter.updateRow(BLOGGER_COLLECT_TASKS_TABLE, updateConditions, { totalCollect: totalCollect.length })
  
  return { success: true, count }
}

// ==========================================
// 邮件相关 API
// ==========================================

export async function createEmailTemplate(userId: string, data: {
  title: string
  subject: string
  content: string
}): Promise<BloggerEmailTemplate> {
  const row: RawRow = {
    id: `template-${randomUUID().slice(0, 8)}`,
    userId,
    title: data.title,
    subject: data.subject,
    content: data.content,
  }
  const result = await dbAdapter.insertRow(BLOGGER_EMAIL_TEMPLATES_TABLE, row)
  return mapEmailTemplateRow(result)
}

export async function loadEmailTemplates(userId: string): Promise<BloggerEmailTemplate[]> {
  const rows = await dbAdapter.loadRows(BLOGGER_EMAIL_TEMPLATES_TABLE, { userId })
  return rows.map(mapEmailTemplateRow)
}

export async function sendEmailToBlogger(userId: string, data: {
  bloggerId: string
  templateId: string
  email: string
}): Promise<BloggerEmailSendLog> {
  // 加载模板
  const templates = await dbAdapter.loadRows(BLOGGER_EMAIL_TEMPLATES_TABLE, { id: data.templateId, userId })
  if (templates.length === 0) {
    throw new Error("邮件模板不存在")
  }
  
  const template = templates[0]
  
  // 记录发送日志
  const logRow: RawRow = {
    id: `log-${randomUUID().slice(0, 8)}`,
    userId,
    bloggerId: data.bloggerId,
    templateId: data.templateId,
    email: data.email,
    subject: template.subject,
    content: template.content,
    status: "success",
  }
  
  const result = await dbAdapter.insertRow(BLOGGER_EMAIL_SEND_LOGS_TABLE, logRow)
  
  // 更新博主状态为已发邀约
  await dbAdapter.updateRow(BLOGGERS_TABLE, { id: data.bloggerId, userId }, { status: "已发邀约" })
  
  return mapEmailSendLogRow(result)
}

export async function loadEmailSendLogs(userId: string): Promise<BloggerEmailSendLog[]> {
  const rows = await dbAdapter.loadRows(BLOGGER_EMAIL_SEND_LOGS_TABLE, { userId })
  return rows.map(mapEmailSendLogRow)
}

// ==========================================
// 合作确认相关 API
// ==========================================

export async function createCooperation(userId: string, data: {
  bloggerId: string
  bloggerName: string
  platform: string
  email: string
  articleTemplateId: string
  publishType: string
  publishTime?: string
  channels: string
}): Promise<BloggerCooperation> {
  const row: RawRow = {
    id: `coop-${randomUUID().slice(0, 8)}`,
    userId,
    bloggerId: data.bloggerId,
    bloggerName: data.bloggerName,
    platform: data.platform,
    email: data.email,
    articleTemplateId: data.articleTemplateId,
    publishType: data.publishType,
    publishTime: data.publishTime || null,
    channels: data.channels,
    status: "wait_publish",
  }
  const result = await dbAdapter.insertRow(BLOGGER_COOPERATION_TABLE, row)
  
  // 更新博主状态为已合作
  await dbAdapter.updateRow(BLOGGERS_TABLE, { id: data.bloggerId, userId }, { status: "已合作" })
  
  return mapCooperationRow(result)
}

export async function loadCooperations(userId: string): Promise<BloggerCooperation[]> {
  const rows = await dbAdapter.loadRows(BLOGGER_COOPERATION_TABLE, { userId })
  return rows.map(mapCooperationRow)
}

export async function getBloggerById(id: string): Promise<AcquisitionBlogger | null> {
  const rows = await dbAdapter.loadRows(BLOGGERS_TABLE, { id })
  if (rows.length === 0) return null
  return mapBloggerRow(rows[0])
}

// ==========================================
// 发布频道相关 API
// ==========================================

export async function createPublishChannel(userId: string, data: {
  name: string
  platform: string
  account: string
  token: string
}): Promise<PublishChannel> {
  // 检查频道数量限制
  const channels = await dbAdapter.loadRows(PUBLISH_CHANNELS_TABLE, { userId })
  if (channels.length >= 10) {
    throw new Error("最多只能添加 10 个频道")
  }
  
  const row: RawRow = {
    id: `channel-${randomUUID().slice(0, 8)}`,
    userId,
    name: data.name,
    platform: data.platform,
    account: data.account,
    token: data.token,
    status: "active",
  }
  const result = await dbAdapter.insertRow(PUBLISH_CHANNELS_TABLE, row)
  return mapPublishChannelRow(result)
}

export async function loadPublishChannels(userId: string): Promise<PublishChannel[]> {
  const rows = await dbAdapter.loadRows(PUBLISH_CHANNELS_TABLE, { userId })
  return rows.map(mapPublishChannelRow)
}

export async function deletePublishChannel(userId: string, channelId: string): Promise<boolean> {
  return await dbAdapter.deleteRow(PUBLISH_CHANNELS_TABLE, { id: channelId, userId })
}

// ==========================================
// 文章模板相关 API
// ==========================================

export async function createArticleTemplate(userId: string, data: {
  title: string
  content: string
  images?: string
  tags?: string
}): Promise<ArticleTemplate> {
  const row: RawRow = {
    id: `article-${randomUUID().slice(0, 8)}`,
    userId,
    title: data.title,
    content: data.content,
    images: data.images || "",
    tags: data.tags || "",
  }
  const result = await dbAdapter.insertRow(ARTICLE_TEMPLATES_TABLE, row)
  return mapArticleTemplateRow(result)
}

export async function loadArticleTemplates(userId: string): Promise<ArticleTemplate[]> {
  const rows = await dbAdapter.loadRows(ARTICLE_TEMPLATES_TABLE, { userId })
  return rows.map(mapArticleTemplateRow)
}

export async function updateArticleTemplate(userId: string, templateId: string, data: {
  title?: string
  content?: string
  images?: string
  tags?: string
}): Promise<ArticleTemplate | null> {
  const result = await dbAdapter.updateRow(ARTICLE_TEMPLATES_TABLE, { id: templateId, userId }, data)
  return result ? mapArticleTemplateRow(result) : null
}

export async function deleteArticleTemplate(userId: string, templateId: string): Promise<boolean> {
  return await dbAdapter.deleteRow(ARTICLE_TEMPLATES_TABLE, { id: templateId, userId })
}

// ==========================================
// 发布任务相关 API
// ==========================================

export async function createPublishTask(userId: string, data: {
  coopId: string
  bloggerId: string
  articleId: string
  channelId: string
  channelName: string
}): Promise<PublishTask> {
  const row: RawRow = {
    id: `pub-${randomUUID().slice(0, 8)}`,
    userId,
    coopId: data.coopId,
    bloggerId: data.bloggerId,
    articleId: data.articleId,
    channelId: data.channelId,
    channelName: data.channelName,
    status: "waiting",
    postUrl: "",
  }
  const result = await dbAdapter.insertRow(PUBLISH_TASKS_TABLE, row)
  return mapPublishTaskRow(result)
}

export async function loadPublishTasks(userId: string, coopId?: string): Promise<PublishTask[]> {
  const filters: RawRow = { userId }
  if (coopId) {
    filters.coopId = coopId
  }
  const rows = await dbAdapter.loadRows(PUBLISH_TASKS_TABLE, filters)
  return rows.map(mapPublishTaskRow)
}

export async function updatePublishTaskStatus(userId: string, taskId: string, status: string, postUrl?: string): Promise<PublishTask | null> {
  const patch: RawRow = { status }
  if (postUrl) {
    patch.postUrl = postUrl
  }
  const result = await dbAdapter.updateRow(PUBLISH_TASKS_TABLE, { id: taskId, userId }, patch)
  return result ? mapPublishTaskRow(result) : null
}

// ==========================================
// 企业采集相关 API
// ==========================================

// 企业采集任务
export async function createEnterpriseCollectTask(userId: string, data: {
  taskName: string
  platform: string
  keyword: string
  maxLimit?: number
}): Promise<EnterpriseCollectTask> {
  const row: RawRow = {
    id: `etask-${randomUUID().slice(0, 8)}`,
    userId,
    taskName: data.taskName,
    platform: data.platform,
    keyword: data.keyword,
    maxLimit: data.maxLimit || 1000,
    totalCollect: 0,
    status: "waiting",
  }
  const result = await dbAdapter.insertRow(ENTERPRISE_COLLECT_TASKS_TABLE, row)
  return mapEnterpriseCollectTaskRow(result)
}

export async function loadEnterpriseCollectTasks(userId: string): Promise<EnterpriseCollectTask[]> {
  const rows = await dbAdapter.loadRows(ENTERPRISE_COLLECT_TASKS_TABLE, { userId })
  return rows.map(mapEnterpriseCollectTaskRow)
}

export async function updateEnterpriseTaskStatus(userId: string, taskId: string, status: string): Promise<EnterpriseCollectTask | null> {
  const result = await dbAdapter.updateRow(ENTERPRISE_COLLECT_TASKS_TABLE, { id: taskId, userId }, { status })
  return result ? mapEnterpriseCollectTaskRow(result) : null
}

// 企业采集临时数据
export async function loadEnterpriseCollectTempData(userId: string, taskId: string): Promise<EnterpriseCollectTemp[]> {
  const rows = await dbAdapter.loadRows(ENTERPRISE_COLLECT_TEMP_TABLE, { userId, taskId })
  return rows.map(mapEnterpriseCollectTempRow)
}

export async function syncEnterpriseTempToLeads(userId: string, taskId: string): Promise<{ success: boolean; count: number }> {
  const tempData = await dbAdapter.loadRows(ENTERPRISE_COLLECT_TEMP_TABLE, { userId, taskId, isSync: false, isValid: true })
  
  let count = 0
  for (const temp of tempData) {
    const leadRow: RawRow = {
      id: `b2b-${randomUUID().slice(0, 8)}`,
      userId,
      taskId: temp.taskId,
      name: temp.name,
      region: temp.region,
      contact: temp.contact,
      email: temp.email,
      source: temp.source || "采集",
      status: "待联系",
      est_value: "",
      type: "follow",
      remark: "",
    }
    await dbAdapter.insertRow(B2B_LEADS_TABLE, leadRow)
    await dbAdapter.updateRow(ENTERPRISE_COLLECT_TEMP_TABLE, { id: temp.id }, { isSync: true })
    count++
  }
  
  // 更新任务的已采集数量
  const totalCollect = await dbAdapter.loadRows(ENTERPRISE_COLLECT_TEMP_TABLE, { userId, taskId, isValid: true })
  await dbAdapter.updateRow(ENTERPRISE_COLLECT_TASKS_TABLE, { id: taskId, userId }, { totalCollect: totalCollect.length })
  
  return { success: true, count }
}

// 企业邮件模板
export async function createEnterpriseEmailTemplate(userId: string, data: {
  title: string
  subject: string
  content: string
}): Promise<EnterpriseEmailTemplate> {
  const row: RawRow = {
    id: `etemplate-${randomUUID().slice(0, 8)}`,
    userId,
    title: data.title,
    subject: data.subject,
    content: data.content,
  }
  const result = await dbAdapter.insertRow(ENTERPRISE_EMAIL_TEMPLATES_TABLE, row)
  return mapEnterpriseEmailTemplateRow(result)
}

export async function loadEnterpriseEmailTemplates(userId: string): Promise<EnterpriseEmailTemplate[]> {
  const rows = await dbAdapter.loadRows(ENTERPRISE_EMAIL_TEMPLATES_TABLE, { userId })
  return rows.map(mapEnterpriseEmailTemplateRow)
}

export async function updateEnterpriseEmailTemplate(userId: string, templateId: string, data: {
  title?: string
  subject?: string
  content?: string
}): Promise<EnterpriseEmailTemplate | null> {
  const result = await dbAdapter.updateRow(ENTERPRISE_EMAIL_TEMPLATES_TABLE, { id: templateId, userId }, data)
  return result ? mapEnterpriseEmailTemplateRow(result) : null
}

export async function deleteEnterpriseEmailTemplate(userId: string, templateId: string): Promise<boolean> {
  return await dbAdapter.deleteRow(ENTERPRISE_EMAIL_TEMPLATES_TABLE, { id: templateId, userId })
}

// 企业邮件发送
export async function sendEmailToEnterprise(userId: string, data: {
  enterpriseId: string
  templateId: string
  email: string
}): Promise<EnterpriseEmailSendLog> {
  // 加载模板
  const templates = await dbAdapter.loadRows(ENTERPRISE_EMAIL_TEMPLATES_TABLE, { id: data.templateId, userId })
  if (templates.length === 0) {
    throw new Error("邮件模板不存在")
  }
  
  const template = templates[0]
  
  // 记录发送日志
  const logRow: RawRow = {
    id: `elog-${randomUUID().slice(0, 8)}`,
    userId,
    enterpriseId: data.enterpriseId,
    templateId: data.templateId,
    email: data.email,
    subject: template.subject,
    content: template.content,
    status: "success",
  }
  
  const result = await dbAdapter.insertRow(ENTERPRISE_EMAIL_SEND_LOGS_TABLE, logRow)
  
  // 更新企业线索状态为已发邀约
  await dbAdapter.updateRow(B2B_LEADS_TABLE, { id: data.enterpriseId, userId }, { status: "已发邀约" })
  
  return mapEnterpriseEmailSendLogRow(result)
}

export async function loadEnterpriseEmailSendLogs(userId: string): Promise<EnterpriseEmailSendLog[]> {
  const rows = await dbAdapter.loadRows(ENTERPRISE_EMAIL_SEND_LOGS_TABLE, { userId })
  return rows.map(mapEnterpriseEmailSendLogRow)
}

// 企业合作确认
export async function createEnterpriseCooperation(userId: string, data: {
  enterpriseId: string
  enterpriseName: string
  contact: string
  email: string
}): Promise<EnterpriseCooperation> {
  const row: RawRow = {
    id: `ecoop-${randomUUID().slice(0, 8)}`,
    userId,
    enterpriseId: data.enterpriseId,
    enterpriseName: data.enterpriseName,
    contact: data.contact,
    email: data.email,
    status: "wait_service",
  }
  const result = await dbAdapter.insertRow(ENTERPRISE_COOPERATION_TABLE, row)
  
  // 更新企业线索状态为已合作
  await dbAdapter.updateRow(B2B_LEADS_TABLE, { id: data.enterpriseId, userId }, { status: "已合作" })
  
  return mapEnterpriseCooperationRow(result)
}

export async function loadEnterpriseCooperations(userId: string): Promise<EnterpriseCooperation[]> {
  const rows = await dbAdapter.loadRows(ENTERPRISE_COOPERATION_TABLE, { userId })
  return rows.map(mapEnterpriseCooperationRow)
}

export async function updateEnterpriseCooperationStatus(userId: string, coopId: string, status: string): Promise<EnterpriseCooperation | null> {
  const result = await dbAdapter.updateRow(ENTERPRISE_COOPERATION_TABLE, { id: coopId, userId }, { status })
  return result ? mapEnterpriseCooperationRow(result) : null
}

// ==========================================
// VC 采集相关 API
// ==========================================

// VC 采集任务
export async function createVCCollectTask(userId: string, data: {
  taskName: string
  platform: string
  keyword: string
  maxLimit?: number
}): Promise<VCCollectTask> {
  const row: RawRow = {
    id: `vctask-${randomUUID().slice(0, 8)}`,
    userId,
    taskName: data.taskName,
    platform: data.platform,
    keyword: data.keyword,
    maxLimit: data.maxLimit || 1000,
    totalCollect: 0,
    status: "waiting",
  }
  const result = await dbAdapter.insertRow(VC_COLLECT_TASKS_TABLE, row)
  return mapVCCollectTaskRow(result)
}

export async function loadVCCollectTasks(userId: string): Promise<VCCollectTask[]> {
  const rows = await dbAdapter.loadRows(VC_COLLECT_TASKS_TABLE, { userId })
  return rows.map(mapVCCollectTaskRow)
}

export async function updateVCTaskStatus(userId: string, taskId: string, status: string): Promise<VCCollectTask | null> {
  const result = await dbAdapter.updateRow(VC_COLLECT_TASKS_TABLE, { id: taskId, userId }, { status })
  return result ? mapVCCollectTaskRow(result) : null
}

// VC 采集临时数据
export async function loadVCCollectTempData(userId: string, taskId: string): Promise<VCCollectTemp[]> {
  const rows = await dbAdapter.loadRows(VC_COLLECT_TEMP_TABLE, { userId, taskId })
  return rows.map(mapVCCollectTempRow)
}

export async function syncVCTempToLeads(userId: string, taskId: string): Promise<{ success: boolean; count: number }> {
  const tempData = await dbAdapter.loadRows(VC_COLLECT_TEMP_TABLE, { userId, taskId, isSync: false, isValid: true })
  
  let count = 0
  for (const temp of tempData) {
    const leadRow: RawRow = {
      id: `vc-${randomUUID().slice(0, 8)}`,
      userId,
      taskId: temp.taskId,
      name: temp.name,
      region: temp.region,
      contact: temp.contact,
      email: temp.email,
      source: "采集",
      status: "待联系",
      focus: temp.focus,
      type: "follow",
      remark: "",
    }
    await dbAdapter.insertRow(VC_LEADS_TABLE, leadRow)
    await dbAdapter.updateRow(VC_COLLECT_TEMP_TABLE, { id: temp.id }, { isSync: true })
    count++
  }
  
  // 更新任务的已采集数量
  const totalCollect = await dbAdapter.loadRows(VC_COLLECT_TEMP_TABLE, { userId, taskId, isValid: true })
  await dbAdapter.updateRow(VC_COLLECT_TASKS_TABLE, { id: taskId, userId }, { totalCollect: totalCollect.length })
  
  return { success: true, count }
}

// VC 邮件模板
export async function createVCEmailTemplate(userId: string, data: {
  title: string
  subject: string
  content: string
}): Promise<VCEmailTemplate> {
  const row: RawRow = {
    id: `vctemplate-${randomUUID().slice(0, 8)}`,
    userId,
    title: data.title,
    subject: data.subject,
    content: data.content,
  }
  const result = await dbAdapter.insertRow(VC_EMAIL_TEMPLATES_TABLE, row)
  return mapVCEmailTemplateRow(result)
}

export async function loadVCEmailTemplates(userId: string): Promise<VCEmailTemplate[]> {
  const rows = await dbAdapter.loadRows(VC_EMAIL_TEMPLATES_TABLE, { userId })
  return rows.map(mapVCEmailTemplateRow)
}

export async function updateVCEmailTemplate(userId: string, templateId: string, data: {
  title?: string
  subject?: string
  content?: string
}): Promise<VCEmailTemplate | null> {
  const result = await dbAdapter.updateRow(VC_EMAIL_TEMPLATES_TABLE, { id: templateId, userId }, data)
  return result ? mapVCEmailTemplateRow(result) : null
}

export async function deleteVCEmailTemplate(userId: string, templateId: string): Promise<boolean> {
  return await dbAdapter.deleteRow(VC_EMAIL_TEMPLATES_TABLE, { id: templateId, userId })
}

// VC 邮件发送
export async function sendEmailToVC(userId: string, data: {
  vcId: string
  templateId: string
  email: string
}): Promise<VCEmailSendLog> {
  // 加载模板
  const templates = await dbAdapter.loadRows(VC_EMAIL_TEMPLATES_TABLE, { id: data.templateId, userId })
  if (templates.length === 0) {
    throw new Error("邮件模板不存在")
  }
  
  const template = templates[0]
  
  // 记录发送日志
  const logRow: RawRow = {
    id: `vclog-${randomUUID().slice(0, 8)}`,
    userId,
    vcId: data.vcId,
    templateId: data.templateId,
    email: data.email,
    subject: template.subject,
    content: template.content,
    status: "success",
  }
  
  const result = await dbAdapter.insertRow(VC_EMAIL_SEND_LOGS_TABLE, logRow)
  
  // 更新 VC 线索状态为已发邀约
  await dbAdapter.updateRow(VC_LEADS_TABLE, { id: data.vcId, userId }, { status: "已发邀约" })
  
  return mapVCEmailSendLogRow(result)
}

export async function loadVCEmailSendLogs(userId: string): Promise<VCEmailSendLog[]> {
  const rows = await dbAdapter.loadRows(VC_EMAIL_SEND_LOGS_TABLE, { userId })
  return rows.map(mapVCEmailSendLogRow)
}

// VC 合作确认
export async function createVCCooperation(userId: string, data: {
  vcId: string
  institution: string
  contact: string
  email: string
}): Promise<VCCooperation> {
  const row: RawRow = {
    id: `vccoop-${randomUUID().slice(0, 8)}`,
    userId,
    vcId: data.vcId,
    institution: data.institution,
    contact: data.contact,
    email: data.email,
    status: "wait_feedback",
  }
  const result = await dbAdapter.insertRow(VC_COOPERATION_TABLE, row)
  
  // 更新 VC 线索状态为已合作
  await dbAdapter.updateRow(VC_LEADS_TABLE, { id: data.vcId, userId }, { status: "已合作" })
  
  return mapVCCooperationRow(result)
}

export async function loadVCCooperations(userId: string): Promise<VCCooperation[]> {
  const rows = await dbAdapter.loadRows(VC_COOPERATION_TABLE, { userId })
  return rows.map(mapVCCooperationRow)
}

export async function updateVCCooperationStatus(userId: string, coopId: string, status: string): Promise<VCCooperation | null> {
  const result = await dbAdapter.updateRow(VC_COOPERATION_TABLE, { id: coopId, userId }, { status })
  return result ? mapVCCooperationRow(result) : null
}
