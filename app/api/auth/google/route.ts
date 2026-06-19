import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { dbAdapter } from "@/lib/db-adapter"

const USERS_TABLE = "users"
const USER_PROFILES_TABLE = "user_profiles"
const USER_MARKET_PROFILES_TABLE = "user_market_profiles"

export async function POST(request: NextRequest) {
  try {
    const { credential, platform: explicitPlatform } = await request.json()
    if (!credential) {
      return NextResponse.json({ ok: false, message: "Missing Google credential" }, { status: 400 })
    }

    // 检测平台：优先使用显式平台参数，其次根据User-Agent判断
    let platform: 'web' | 'mobile' = 'web'
    if (explicitPlatform === 'mobile') {
      platform = 'mobile'
    } else {
      const userAgent = request.headers.get('user-agent') || ''
      const isMobileApp = /(Android|iPhone|iPad|Mobile|WebView)/i.test(userAgent)
      if (isMobileApp) {
        platform = 'mobile'
      }
    }

    // 根据平台选择客户端ID
    const clientId = platform === 'mobile'
      ? process.env.NEXT_PUBLIC_MOBILE_GOOGLE_CLIENT_ID
      : process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ ok: false, message: `Google client ID not configured for ${platform}` }, { status: 500 })
    }

    // 验证 Google ID Token
    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) {
      return NextResponse.json({ ok: false, message: "Invalid Google token" }, { status: 401 })
    }

    const { email, name, picture, sub: googleId } = payload
    const now = new Date().toISOString()

    // 查找或创建用户
    let users = await dbAdapter.loadRows(USERS_TABLE, { email })
    let userId: string

    if (users.length === 0) {
      // 新用户：自动注册
      const userRow = await dbAdapter.insertRow(USERS_TABLE, {
        email,
        password: `google_${googleId}`, // Google 用户不需要密码
        role: "user",
        provider: "google",
        googleId,
      })
      userId = userRow._id || userRow.id

      const nickname = name || email.split("@")[0]
      await dbAdapter.insertRow(USER_PROFILES_TABLE, {
        id: userId, userId, nickname,
        avatar: picture || "", phone: "",
      })
      await dbAdapter.insertRow(USER_MARKET_PROFILES_TABLE, {
        id: userId, userId, nickname,
        avatar: picture || "",
        isInfluencerVerified: false, isMerchantVerified: false,
        isRealNameVerified: false, isRealInfluencer: false, isRealMerchant: false,
        balance: 0, totalEarnings: 0, adViewsCount: 0,
        fullName: "", idNumber: "", platform: "", followers: "",
        cost: "", commission: "", companyName: "", creditCode: "",
        businessLicenseUrl: "", brandName: "", contactPerson: "",
        contactPhone: "", industry: "",
      })
    } else {
      userId = users[0]._id || users[0].id
    }

    const response = NextResponse.json({
      ok: true,
      message: "Google 登录成功",
      user: { userId, email, nickname: name || email.split("@")[0], avatar: picture }
    })

    // 设置登录 Cookie
    response.cookies.set("market_user_id", userId, {
      path: "/", maxAge: 60 * 60 * 24 * 7,
      httpOnly: true, sameSite: "lax",
    })

    return response
  } catch (error: any) {
    console.error("[Google Auth]", error)
    return NextResponse.json({ ok: false, message: error.message || "Google 登录失败" }, { status: 500 })
  }
}
