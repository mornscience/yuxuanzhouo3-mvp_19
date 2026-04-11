import { NextRequest, NextResponse } from "next/server"
import { dbAdapter } from "@/lib/db-adapter"

const USERS_TABLE = "users"
const USER_PROFILES_TABLE = "user_profiles"
const USER_MARKET_PROFILES_TABLE = "user_market_profiles"

/**
 * GET /api/auth/wechat/callback
 * 微信扫码后回调，code 换 access_token，再获取用户信息
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=wechat_no_code`)
  }

  const appId = process.env.NEXT_PUBLIC_WECHAT_APP_ID
  const appSecret = process.env.WECHAT_APP_SECRET

  if (!appId || !appSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=wechat_not_configured`)
  }

  try {
    // Step 1: code 换 access_token + openid
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.errcode) {
      console.error("[WeChat Callback] token error:", tokenData)
      return NextResponse.redirect(`${baseUrl}/login?error=wechat_token_failed`)
    }

    const { access_token, openid, unionid } = tokenData

    // Step 2: 获取用户信息
    const userRes = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
    )
    const wxUser = await userRes.json()

    if (wxUser.errcode) {
      console.error("[WeChat Callback] userinfo error:", wxUser)
      return NextResponse.redirect(`${baseUrl}/login?error=wechat_userinfo_failed`)
    }

    const { nickname, headimgurl } = wxUser
    // 用 openid 作为唯一标识查找用户
    const wechatId = unionid || openid

    // Step 3: 查找或创建用户
    let users = await dbAdapter.loadRows(USERS_TABLE, { wechatId })
    let userId: string

    if (users.length === 0) {
      // 新用户自动注册
      const userRow = await dbAdapter.insertRow(USERS_TABLE, {
        email: `wx_${wechatId}@wechat.local`, // 微信用户无邮箱，用占位
        password: `wechat_${wechatId}`,
        role: "user",
        provider: "wechat",
        wechatId,
        openid,
        unionid: unionid || "",
      })
      userId = userRow._id || userRow.id

      await dbAdapter.insertRow(USER_PROFILES_TABLE, {
        id: userId, userId,
        nickname: nickname || "微信用户",
        avatar: headimgurl || "",
        phone: "",
      })
      await dbAdapter.insertRow(USER_MARKET_PROFILES_TABLE, {
        id: userId, userId,
        nickname: nickname || "微信用户",
        avatar: headimgurl || "",
        isInfluencerVerified: false, isMerchantVerified: false,
        isRealNameVerified: false, isRealInfluencer: false, isRealMerchant: false,
        balance: 0, totalEarnings: 0, adViewsCount: 0,
        fullName: "", idNumber: "", platform: "", followers: "",
        cost: "", commission: "", companyName: "", creditCode: "",
        businessLicenseUrl: "", brandName: "", contactPerson: "",
        contactPhone: "", industry: "",
      })

      // 新用户分配 AI 搜索初始额度
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
    } else {
      userId = users[0]._id || users[0].id
    }

    // Step 4: 设置 Cookie 并跳转
    const response = NextResponse.redirect(`${baseUrl}/?wechat_login=success`)
    response.cookies.set("market_user_id", userId, {
      path: "/", maxAge: 60 * 60 * 24 * 7,
      httpOnly: true, sameSite: "lax",
    })

    // 把用户信息存到 URL 参数，前端读取后写 localStorage
    const params = new URLSearchParams({
      wechat_login: "success",
      userId,
      nickname: nickname || "微信用户",
      avatar: headimgurl || "",
    })
    return NextResponse.redirect(`${baseUrl}/?${params.toString()}`)

  } catch (error: any) {
    console.error("[WeChat Callback] error:", error)
    return NextResponse.redirect(`${baseUrl}/login?error=wechat_failed`)
  }
}
