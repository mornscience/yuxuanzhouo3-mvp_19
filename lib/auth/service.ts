import { dbAdapter, isCN } from "@/lib/db-adapter"
import { getSupabase } from "@/lib/db-adapter"
import { randomUUID } from "crypto"

// 表名常量
const USERS_TABLE = "users"
const USER_PROFILES_TABLE = "user_profiles"
const USER_MARKET_PROFILES_TABLE = "user_market_profiles"
const AI_SEARCH_QUOTA_TABLE = "ai_search_quota"

// 注册时分配 AI 搜索初始额度
async function grantInitialAIQuota(userId: string) {
  try {
    if (!isCN()) {
      const sb = getSupabase()
      await sb.from(AI_SEARCH_QUOTA_TABLE).upsert({
        id: `quota-${randomUUID().slice(0, 8)}`,
        user_id: userId,
        balance: 0.1,       // 注册送 ¥0.1 = 200次
        total_used: 0,
        call_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
    }
  } catch (e) {
    console.error("[Auth] grantInitialAIQuota error:", e)
  }
}

// 用户注册
export async function registerUser(email: string, password: string, options?: { referralCode?: string }): Promise<{ ok: boolean; message: string; userId?: string }> {
  try {
    // 输入验证
    if (!email || !email.includes("@")) {
      return { ok: false, message: "请输入有效的邮箱地址" }
    }

    if (!password || password.length < 6) {
      return { ok: false, message: "密码长度至少6位" }
    }

    // 检查邮箱是否已存在
    const existingUsers = await dbAdapter.loadRows(USERS_TABLE, { email })
    if (existingUsers.length > 0) {
      return { ok: false, message: "该邮箱已被注册" }
    }

    // 准备时间戳（dbAdapter会自动添加，但这里需要用于其他表）
    const now = new Date().toISOString()

    // 1. 创建用户账号
    const userRow = await dbAdapter.insertRow(USERS_TABLE, {
      email,
      password, // 明文存储
      role: "user",
      provider: "email",
      created_at: now,
      updated_at: now
    })

    const userId = userRow.id || userRow._id // Supabase 返回 id，CloudBase 返回 _id

    // 2. 创建基础资料
    const nickname = email.split("@")[0]
    await dbAdapter.insertRow(USER_PROFILES_TABLE, {
      id: userId,
      userId,
      nickname,
      avatar: "",
      phone: "",
      created_at: now
    })

    // 3. 创建市场资料
    await dbAdapter.insertRow(USER_MARKET_PROFILES_TABLE, {
      id: userId,
      userId,
      nickname,
      // 达人字段 - 初始未认证
      isInfluencerVerified: false,
      platform: "",
      platformAccount: "",
      platformHomeUrl: "",
      followers: "",
      cost: "",
      commission: "",
      // 商家字段 - 初始未认证
      isMerchantVerified: false,
      companyName: "",
      creditCode: "",
      businessLicenseUrl: "",
      brandName: "",
      contactPerson: "",
      contactPhone: "",
      industry: "",
      // 资产字段
      balance: 0,
      totalEarnings: 0,
      // 兼容字段（用于现有系统）
      avatar: "",
      fullName: "",
      idNumber: "",
      isRealNameVerified: false,
      isRealInfluencer: false,
      isRealMerchant: false,
      adViewsCount: 0,
      created_at: now,
      updated_at: now
    })

    console.log(`[Auth Service] 用户注册成功: ${email}, userId: ${userId}`)

    // 分配 AI 搜索初始额度 ¥0.1（约200次）
    await grantInitialAIQuota(userId)

    // 绑定邀请关系（如果有邀请码）
    // 注意：cookie 在服务端注册接口里读取，这里通过参数传入
    if (options?.referralCode) {
      try {
        const sb = getSupabase()
        // 找邀请人
        const { data: inviter } = await sb.from("users").select("id").eq("referral_code", options.referralCode).maybeSingle()
        if (inviter?.id && inviter.id !== userId) {
          await sb.from("referral_relations").insert({
            id: `rr-${randomUUID().slice(0, 8)}`,
            inviter_user_id: inviter.id,
            invited_user_id: userId,
            share_code: options.referralCode,
            status: "bound",
            created_at: now,
          })
          console.log(`[Auth Service] 邀请关系绑定: ${inviter.id} → ${userId}`)
        }
      } catch (e) {
        console.warn("[Auth Service] 邀请关系绑定失败（非致命）:", e)
      }
    }

    return { ok: true, message: "注册成功", userId }
  } catch (error: any) {
    console.error("[Auth Service] 注册错误:", error)

    // 处理数据库环境错误
    const errorMsg = error.message || "注册失败"
    if (errorMsg.includes("env not exists") || error.code === "INVALID_ENV") {
      return { ok: false, message: "数据库环境配置异常，请检查环境 ID 或联系管理员" }
    }

    return { ok: false, message: errorMsg }
  }
}

// 用户登录
export async function loginUser(email: string, password: string): Promise<{ ok: boolean; message: string; user?: any }> {
  try {
    // 输入验证
    if (!email || !email.includes("@")) {
      return { ok: false, message: "请输入有效的邮箱地址" }
    }

    if (!password) {
      return { ok: false, message: "请输入密码" }
    }

    // 查找用户
    const users = await dbAdapter.loadRows(USERS_TABLE, { email })
    if (users.length === 0) {
      return { ok: false, message: "用户不存在或密码错误" }
    }

    const user = users[0]

    // 明文密码比对
    if (user.password !== password) {
      return { ok: false, message: "用户不存在或密码错误" }
    }

    // 获取用户资料
    const userPk = user.id || user._id  // Supabase 用 id，CloudBase 用 _id
    const [profile, marketProfile] = await Promise.all([
      dbAdapter.loadSingleRow(USER_PROFILES_TABLE, { userId: userPk }),
      dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { userId: userPk })
    ])

    const userData = {
      userId: userPk,
      email: user.email,
      role: user.role,
      profile: profile || {},
      marketProfile: marketProfile || {}
    }

    return { ok: true, message: "登录成功", user: userData }
  } catch (error: any) {
    console.error("[Auth Service] 登录错误:", error)

    // 处理数据库环境错误
    const errorMsg = error.message || "登录失败"
    if (errorMsg.includes("env not exists") || error.code === "INVALID_ENV") {
      return { ok: false, message: "数据库环境配置异常，请检查环境 ID 或联系管理员" }
    }

    return { ok: false, message: errorMsg }
  }
}

// 获取当前用户信息
export async function getCurrentUser(userId: string): Promise<{ ok: boolean; message: string; user?: any; profile?: any; marketProfile?: any }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    const [user, profile, marketProfile] = await Promise.all([
      dbAdapter.loadSingleRow(USERS_TABLE, { id: userId }),   // Supabase
      dbAdapter.loadSingleRow(USER_PROFILES_TABLE, { userId }),
      dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { userId })
    ])

    if (!user) {
      // 检查是否是 CloudBase 环境
      if (isCN()) {
        // CloudBase 用 _id 查
        const userByCb = await dbAdapter.loadSingleRow(USERS_TABLE, { _id: userId })
        if (!userByCb) return { ok: false, message: "用户不存在" }
        const { password: _pw, ...safeUser } = userByCb
        return { ok: true, message: "获取成功", user: safeUser, profile: profile || {}, marketProfile: marketProfile || {} }
      } else {
        // Supabase 环境，只通过 id 字段查询
        return { ok: false, message: "用户不存在" }
      }
    }

    // 移除敏感信息
    const { password, ...safeUser } = user

    return {
      ok: true,
      message: "获取成功",
      user: safeUser,
      profile: profile || {},
      marketProfile: marketProfile || {}
    }
  } catch (error: any) {
    console.error("[Auth Service] 获取用户信息错误:", error)
    return { ok: false, message: error.message || "获取用户信息失败" }
  }
}

// 更新基础资料
export async function updateUserProfile(userId: string, data: { nickname?: string; avatar?: string; phone?: string }): Promise<{ ok: boolean; message: string }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    const updateData: any = {}
    if (data.nickname !== undefined) updateData.nickname = data.nickname
    if (data.avatar !== undefined) updateData.avatar = data.avatar
    if (data.phone !== undefined) updateData.phone = data.phone

    if (Object.keys(updateData).length === 0) {
      return { ok: false, message: "没有需要更新的字段" }
    }

    const result = await dbAdapter.updateRow(USER_PROFILES_TABLE, { userId }, updateData)

    if (!result) {
      return { ok: false, message: "用户资料不存在" }
    }

    return { ok: true, message: "资料更新成功" }
  } catch (error: any) {
    console.error("[Auth Service] 更新资料错误:", error)
    return { ok: false, message: error.message || "更新资料失败" }
  }
}

// 达人认证（自动通过）
export async function applyInfluencerVerification(userId: string, data: {
  platform: string
  platformAccount: string
  platformHomeUrl: string
  followers: string
  cost: string
  commission: string
}): Promise<{ ok: boolean; message: string }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    // 直接用 Supabase 原生更新，绕过 dbAdapter 的字段名转换问题
    if (!isCN()) {
      const sb = getSupabase()

      // 先查记录（同时尝试 id 和 user_id）
      const { data: rows } = await sb
        .from("user_market_profiles")
        .select("id")
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .limit(1)

      const patch = {
        is_influencer_verified: true,
        platform: data.platform,
        platform_account: data.platformAccount,
        platform_home_url: data.platformHomeUrl,
        followers: data.followers,
        cost: data.cost,
        commission: data.commission,
        updated_at: new Date().toISOString(),
      }

      if (rows && rows.length > 0) {
        const pk = rows[0].id
        const { error } = await sb.from("user_market_profiles").update(patch).eq("id", pk)
        if (error) return { ok: false, message: error.message }
        return { ok: true, message: "达人认证成功" }
      }

      // 不存在则创建
      const { error: insertError } = await sb.from("user_market_profiles").insert({
        id: userId,
        user_id: userId,
        nickname: "",
        ...patch,
        balance: 0,
        total_earnings: 0,
        ad_views_count: 0,
        is_merchant_verified: false,
        is_real_name_verified: false,
        is_real_influencer: false,
        is_real_merchant: false,
      })
      if (insertError) return { ok: false, message: insertError.message }
      return { ok: true, message: "达人认证成功" }
    }

    // CloudBase 走原有逻辑
    const updateData = {
      isInfluencerVerified: true,
      platform: data.platform,
      platformAccount: data.platformAccount,
      platformHomeUrl: data.platformHomeUrl,
      followers: data.followers,
      cost: data.cost,
      commission: data.commission,
    }
    const existing = await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { userId })
      ?? await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { id: userId })
    if (existing) {
      await dbAdapter.updateRow(USER_MARKET_PROFILES_TABLE, { id: existing.id || existing._id }, updateData)
    } else {
      await dbAdapter.insertRow(USER_MARKET_PROFILES_TABLE, {
        id: userId, userId, _id: userId, nickname: "",
        ...updateData,
        balance: 0, totalEarnings: 0, adViewsCount: 0,
        isMerchantVerified: false, isRealNameVerified: false,
        isRealInfluencer: false, isRealMerchant: false,
      })
    }
    return { ok: true, message: "达人认证成功" }
  } catch (error: any) {
    console.error("[Auth Service] 达人认证错误:", error)
    return { ok: false, message: error.message || "达人认证失败" }
  }
}

// 商家认证（需要管理员审核）
export async function applyMerchantVerification(userId: string, data: {
  companyName: string
  creditCode: string
  businessLicenseUrl: string
  brandName: string
  companyWebsite: string
  contactPerson: string
  contactPhone: string
  industry: string
}): Promise<{ ok: boolean; message: string }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    // 直接用 Supabase 原生更新，绕过 dbAdapter 的字段名转换问题
    if (!isCN()) {
      const sb = getSupabase()

      const { data: rows } = await sb
        .from("user_market_profiles")
        .select("id")
        .or(`id.eq.${userId},user_id.eq.${userId}`)
        .limit(1)

      const patch = {
        is_merchant_verified: false,
        merchant_verify_status: "pending",
        company_name: data.companyName,
        credit_code: data.creditCode,
        business_license_url: data.businessLicenseUrl,
        brand_name: data.brandName,
        company_website: data.companyWebsite,
        contact_person: data.contactPerson,
        contact_phone: data.contactPhone,
        industry: data.industry,
        updated_at: new Date().toISOString(),
      }

      if (rows && rows.length > 0) {
        const pk = rows[0].id
        const { error } = await sb.from("user_market_profiles").update(patch).eq("id", pk)
        if (error) return { ok: false, message: error.message }
        return { ok: true, message: "商家认证成功" }
      }

      const { error: insertError } = await sb.from("user_market_profiles").insert({
        id: userId,
        user_id: userId,
        nickname: "",
        ...patch,
        balance: 0,
        total_earnings: 0,
        ad_views_count: 0,
        is_influencer_verified: false,
        is_real_name_verified: false,
        is_real_influencer: false,
        is_real_merchant: false,
      })
      if (insertError) return { ok: false, message: insertError.message }
      return { ok: true, message: "商家认证成功" }
    }

    // CloudBase 走原有逻辑
    const updateData = {
      isMerchantVerified: true,
      companyName: data.companyName,
      creditCode: data.creditCode,
      businessLicenseUrl: data.businessLicenseUrl,
      brandName: data.brandName,
      companyWebsite: data.companyWebsite,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      industry: data.industry,
    }
    const existing = await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { userId })
      ?? await dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { id: userId })
    if (existing) {
      await dbAdapter.updateRow(USER_MARKET_PROFILES_TABLE, { id: existing.id || existing._id }, updateData)
    } else {
      await dbAdapter.insertRow(USER_MARKET_PROFILES_TABLE, {
        id: userId, userId, _id: userId, nickname: "",
        ...updateData,
        balance: 0, totalEarnings: 0, adViewsCount: 0,
        isInfluencerVerified: false, isRealNameVerified: false,
        isRealInfluencer: false, isRealMerchant: false,
      })
    }
    return { ok: true, message: "商家认证成功" }
  } catch (error: any) {
    console.error("[Auth Service] 商家认证错误:", error)
    return { ok: false, message: error.message || "商家认证失败" }
  }
}

// 更新用户密码
export async function updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    if (!oldPassword || !newPassword) {
      return { ok: false, message: "请输入旧密码和新密码" }
    }

    if (newPassword.length < 6) {
      return { ok: false, message: "新密码长度至少6位" }
    }

    // 查找用户（兼容 Supabase id 和 CloudBase _id）
    let user = await dbAdapter.loadSingleRow(USERS_TABLE, { id: userId })
    if (!user) user = await dbAdapter.loadSingleRow(USERS_TABLE, { _id: userId })
    if (!user) {
      return { ok: false, message: "用户不存在" }
    }

    // 验证旧密码（明文比对）
    if (user.password !== oldPassword) {
      return { ok: false, message: "旧密码错误" }
    }

    // 更新密码（兼容两种主键）
    const pkFilter = user.id ? { id: user.id } : { _id: user._id }
    const result = await dbAdapter.updateRow(USERS_TABLE, pkFilter, {
      password: newPassword,
      updated_at: new Date().toISOString()
    })

    if (!result) {
      return { ok: false, message: "密码更新失败" }
    }

    return { ok: true, message: "密码更新成功" }
  } catch (error: any) {
    console.error("[Auth Service] 更新密码错误:", error)
    return { ok: false, message: error.message || "密码更新失败" }
  }
}