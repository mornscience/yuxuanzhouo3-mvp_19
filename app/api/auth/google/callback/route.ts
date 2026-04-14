import { NextRequest, NextResponse } from "next/server"
import { dbAdapter } from "@/lib/db-adapter"

const USERS_TABLE = "users"
const USER_PROFILES_TABLE = "user_profiles"
const USER_MARKET_PROFILES_TABLE = "user_market_profiles"

// 创建支持代理的 fetch（本地开发走 Clash 代理）
async function proxyFetch(url: string, options?: RequestInit) {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
  if (proxyUrl && process.env.NODE_ENV === "development") {
    try {
      const { ProxyAgent, fetch: undiciFetch } = await import("undici")
      const dispatcher = new ProxyAgent(proxyUrl)
      return undiciFetch(url, { ...options, dispatcher } as any) as unknown as Response
    } catch {
      // undici not available, fall back to native fetch
    }
  }
  return fetch(url, options)
}

/**
 * GET /api/auth/google/callback
 * Google OAuth 授权码回调，code 换 token，获取用户信息，登录/注册
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_no_code`)
  }

  const clientId     = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri  = `${baseUrl}/api/auth/google/callback`

  console.log("[Google Callback] baseUrl:", baseUrl)
  console.log("[Google Callback] redirectUri:", redirectUri)
  console.log("[Google Callback] clientId exists:", !!clientId)
  console.log("[Google Callback] clientSecret exists:", !!clientSecret)
  console.log("[Google Callback] code:", code?.slice(0, 20))

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_not_configured`)
  }

  try {
    // Step 1: code 换 access_token + id_token
    const tokenRes = await proxyFetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error) {
      console.error("[Google Callback] token error:", JSON.stringify(tokenData))
      console.error("[Google Callback] redirectUri used:", redirectUri)
      console.error("[Google Callback] clientId:", clientId?.slice(0, 20))
      const errDetail = encodeURIComponent(tokenData.error_description || tokenData.error)
      return NextResponse.redirect(`${baseUrl}/login?error=google_token_failed&detail=${errDetail}`)
    }

    // Step 2: 用 access_token 获取用户信息
    const userRes = await proxyFetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const googleUser = await userRes.json()
    if (!googleUser.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_userinfo_failed`)
    }

    const { id: googleId, email, name, picture } = googleUser

    // Step 3: 查找或创建用户
    let users = await dbAdapter.loadRows(USERS_TABLE, { googleId })
    // 也尝试用邮箱查（可能之前用邮箱注册过）
    if (users.length === 0) {
      users = await dbAdapter.loadRows(USERS_TABLE, { email })
    }

    let userId: string
    if (users.length === 0) {
      const userRow = await dbAdapter.insertRow(USERS_TABLE, {
        email,
        password: `google_${googleId}`,
        role: "user",
        provider: "google",
        googleId,
      })
      // Supabase 返回 id，CloudBase 返回 _id
      userId = userRow.id || userRow._id

      const nickname = name || email.split("@")[0]
      await dbAdapter.insertRow(USER_PROFILES_TABLE, {
        id: userId, userId, nickname, avatar: picture || "", phone: "",
      })
      await dbAdapter.insertRow(USER_MARKET_PROFILES_TABLE, {
        id: userId, userId, nickname, avatar: picture || "",
        isInfluencerVerified: false, isMerchantVerified: false,
        isRealNameVerified: false, isRealInfluencer: false, isRealMerchant: false,
        balance: 0, totalEarnings: 0, adViewsCount: 0,
        fullName: "", idNumber: "", platform: "", followers: "",
        cost: "", commission: "", companyName: "", creditCode: "",
        businessLicenseUrl: "", brandName: "", contactPerson: "",
        contactPhone: "", industry: "",
      })
    } else {
      userId = users[0].id || users[0]._id
      // 补充 googleId（如果是邮箱用户首次 Google 登录）
      if (!users[0].googleId) {
        await dbAdapter.updateRow(USERS_TABLE, { id: userId }, { googleId, provider: "google" })
      }
    }

    // 新用户分配 AI 搜索初始额度
    if (users.length === 0) {
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { randomUUID } = await import("crypto")
        await sb.from("ai_search_quota").upsert({
          id: `quota-${randomUUID().slice(0, 8)}`,
          user_id: userId, balance: 0.1, total_used: 0, call_count: 0,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
      } catch {}
    }

    // Step 4: 设置 Cookie，把用户信息带到前端
    const nickname = name || email.split("@")[0]
    const params = new URLSearchParams({
      google_login: "success",
      userId,
      email,
      nickname,
      avatar: picture || "",
    })
    const isProduction = baseUrl.startsWith("https://")
    const response = NextResponse.redirect(`${baseUrl}/?${params.toString()}`, { status: 302 })
    response.cookies.set("market_user_id", userId, {
      path: "/", maxAge: 60 * 60 * 24 * 7,
      httpOnly: true, sameSite: "lax",
      secure: isProduction,
    })
    return response

  } catch (error: any) {
    const msg = error?.message || "google_failed"
    const isFetchFailed = msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT")
    console.error("[Google Callback] error:", msg)
    if (isFetchFailed) {
      // 本地网络无法访问 Google API（被墙），部署到线上后正常
      return NextResponse.redirect(`${baseUrl}/login?error=network_blocked`)
    }
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(msg)}`)
  }
}
