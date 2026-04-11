import { NextRequest, NextResponse } from "next/server"
import { readSessionFromRequest } from "@/lib/market1/admin-auth"
import {
  getFissionOverview, getFissionRelations,
  getAssetAccounts, getAssetLedgers, adjustAsset,
  getWithdrawals, reviewWithdrawal,
} from "@/lib/market1/fission"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const session = readSessionFromRequest(req)
  if (!session) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 })

  const tab = req.nextUrl.searchParams.get("tab") || "overview"
  const page = Number(req.nextUrl.searchParams.get("page") || 1)
  const limit = Number(req.nextUrl.searchParams.get("limit") || 10)
  const status = req.nextUrl.searchParams.get("status") || "all"
  const assetType = req.nextUrl.searchParams.get("assetType") || "all"
  const query = req.nextUrl.searchParams.get("query") || ""

  try {
    if (tab === "overview") {
      const data = await getFissionOverview()
      return NextResponse.json({ success: true, data })
    }
    if (tab === "fission") {
      const data = await getFissionRelations({ page, limit, status })
      return NextResponse.json({ success: true, data })
    }
    if (tab === "assets") {
      const [accounts, ledgers] = await Promise.all([
        getAssetAccounts({ page, limit, query }),
        getAssetLedgers({ page, limit, assetType }),
      ])
      return NextResponse.json({ success: true, data: { accounts, ledgers } })
    }
    if (tab === "withdraw") {
      const data = await getWithdrawals({ page, limit, status })
      return NextResponse.json({ success: true, data })
    }
    return NextResponse.json({ success: false, error: "未知 tab" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = readSessionFromRequest(req)
  if (!session) return NextResponse.json({ success: false, error: "未授权" }, { status: 401 })

  try {
    const body = await req.json()
    const action = String(body.action || "")

    if (action === "adjust_asset") {
      await adjustAsset({
        userId: String(body.userId || ""),
        assetType: String(body.assetType || "points"),
        amount: Number(body.amount || 0),
        remark: String(body.remark || ""),
        operator: session.username,
      })
      return NextResponse.json({ success: true })
    }

    if (action === "review_withdrawal") {
      await reviewWithdrawal({
        id: String(body.id || ""),
        action: body.reviewAction === "approve" ? "approve" : "reject",
        note: String(body.note || ""),
        operator: session.username,
      })
      return NextResponse.json({ success: true })
    }

    if (action === "issue_discount") {
      const { createClient } = await import("@supabase/supabase-js")
      const { randomUUID } = await import("crypto")
      const { isCN } = await import("@/lib/db-adapter")
      const inviterUserId = String(body.inviterUserId || "")
      const discount = parseFloat(body.discount)
      if (!inviterUserId || isNaN(discount) || discount <= 0 || discount >= 1) {
        return NextResponse.json({ success: false, error: "参数无效" }, { status: 400 })
      }
      // 生成折扣码：INVITE + 随机6位大写
      const code = `INVITE${randomUUID().slice(0,6).toUpperCase()}`
      const now = new Date().toISOString()
      const row = {
        id: `rdc-${randomUUID().slice(0,8)}`,
        code,
        inviter_user_id: inviterUserId,
        relation_id: String(body.relationId || ""),
        discount,
        max_uses: parseInt(body.maxUses) || 1,
        used_count: 0,
        expires_at: body.expiresAt || null,
        created_by: session.username,
        created_at: now,
        updated_at: now,
      }
      if (!isCN()) {
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { error } = await sb.from("referral_discount_codes").insert(row)
        if (error) throw new Error(error.message)
        // 同步写入 discount_codes 表（会员购买折扣码复用）
        await sb.from("discount_codes").upsert({
          id: `dc-ref-${randomUUID().slice(0,8)}`,
          code,
          discount,
          max_uses: parseInt(body.maxUses) || 1,
          used_count: 0,
          expires_at: body.expiresAt || "2099-12-31 23:59:59",
        }, { onConflict: "code" })
      }
      return NextResponse.json({ success: true, code })
    }

    return NextResponse.json({ success: false, error: "未知操作" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
