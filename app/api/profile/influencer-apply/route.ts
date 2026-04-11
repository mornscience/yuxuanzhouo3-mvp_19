import { NextRequest, NextResponse } from "next/server"
import { applyInfluencerVerification } from "@/lib/auth/service"

export async function POST(request: NextRequest) {
  try {
    // 从 cookie 中获取用户 ID
    const cookieHeader = request.headers.get("cookie") || ""
    const match = cookieHeader.match(/(?:^|;\s*)market_user_id=([^;]+)/)
    const userId = match ? decodeURIComponent(match[1]) : ""

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "用户未登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { platform, platformAccount, platformHomeUrl, followers, cost, commission } = body

    // 验证必填字段
    if (!platform || !platformAccount || !followers) {
      return NextResponse.json(
        { ok: false, message: "平台、账号和粉丝数为必填项" },
        { status: 400 }
      )
    }

    const result = await applyInfluencerVerification(userId, {
      platform,
      platformAccount,
      platformHomeUrl: platformHomeUrl || "",
      followers,
      cost: cost || "",
      commission: commission || ""
    })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: 400 }
      )
    }

    // 同步写入 market1_verify_requests，供管理后台查看
    try {
      const { createClient } = await import("@supabase/supabase-js")
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { randomUUID } = await import("crypto")
      await sb.from("market1_verify_requests").insert({
        id: `vr-${randomUUID().slice(0, 8)}`,
        user_id: userId,
        verify_type: "influencer",
        platform,
        platform_account: platformAccount,
        followers,
        status: "approved",
        reviewed_by: "auto",
        reviewed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (e) {
      console.warn("[influencer-apply] 写入 market1_verify_requests 失败（非致命）:", e)
    }

    return NextResponse.json({
      ok: true,
      message: result.message
    })

  } catch (error: any) {
    console.error("[API /api/profile/influencer-apply] 错误:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "达人认证失败" },
      { status: 500 }
    )
  }
}