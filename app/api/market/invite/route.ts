import { NextRequest, NextResponse } from "next/server"
import { getUserInviteData } from "@/lib/market1/fission"
import { isCN } from "@/lib/db-adapter"
import { randomBytes } from "crypto"

function getUserId(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

function genCode() {
  return randomBytes(4).toString("hex").toUpperCase() // 8位大写
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })
  try {
    // 国际版：确保用户有 referral_code
    if (!isCN()) {
      const { createClient } = await import("@supabase/supabase-js")
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const { data: user } = await sb.from("users").select("id,referral_code").eq("id", userId).maybeSingle()
      if (user && !user.referral_code) {
        // 生成唯一邀请码
        let code = genCode()
        for (let i = 0; i < 5; i++) {
          const { data: exists } = await sb.from("users").select("id").eq("referral_code", code).maybeSingle()
          if (!exists) break
          code = genCode()
        }
        await sb.from("users").update({ referral_code: code }).eq("id", userId)
      }
    }

    const data = await getUserInviteData(userId)

    // 查询该用户的折扣券
    let discountCodes: any[] = []
    if (!isCN()) {
      const { createClient } = await import("@supabase/supabase-js")
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: codes } = await sb.from("referral_discount_codes")
        .select("code,discount,max_uses,used_count,expires_at,created_at")
        .eq("inviter_user_id", userId)
        .order("created_at", { ascending: false })
      discountCodes = codes || []
    }

    return NextResponse.json({ ok: true, data: { ...data, discountCodes } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
