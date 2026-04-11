/**
 * 营销中台核心逻辑
 * 国内：腾讯云 CloudBase
 * 国外：Supabase
 */
import { isCN } from "@/lib/db-adapter"
import { randomUUID } from "crypto"

function now() { return new Date().toISOString() }

async function getSB() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getCB() {
  const cb = await import("@cloudbase/node-sdk")
  const app = cb.init({ env: process.env.CLOUDBASE_ENV_ID!, secretId: process.env.CLOUDBASE_SECRET_ID!, secretKey: process.env.CLOUDBASE_SECRET_KEY! })
  return app.database()
}

async function safeList(table: string, filters?: Record<string, any>) {
  if (isCN()) {
    const db = await getCB()
    try {
      const q = filters ? db.collection(table).where(filters) : db.collection(table)
      const r = await q.get()
      return Array.isArray(r?.data) ? r.data : []
    } catch (e: any) {
      if (String(e?.message || "").includes("not exist")) return []
      throw e
    }
  }
  const sb = await getSB()
  let q = sb.from(table).select("*").order("created_at", { ascending: false })
  if (filters) {
    for (const [k, v] of Object.entries(filters)) q = q.eq(k, v)
  }
  const { data, error } = await q
  if (error) { if (error.code === "42P01") return []; throw new Error(error.message) }
  return data || []
}

// ── 总览数据 ──────────────────────────────────────────
export async function getFissionOverview() {
  const [relations, links, withdrawals, assets] = await Promise.all([
    safeList("referral_relations"),
    safeList("referral_links"),
    safeList("market_withdrawals"),
    safeList("market_asset_accounts"),
  ])

  const activated = relations.filter((r: any) => r.status === "activated" || r.activated_at)
  const pending = withdrawals.filter((w: any) => w.status === "pending")
  const totalClicks = links.reduce((s: number, l: any) => s + (l.click_count || 0), 0)

  // 资产汇总
  const assetTotals: Record<string, { available: number; frozen: number }> = {}
  for (const a of assets) {
    const t = (a as any).asset_type
    if (!assetTotals[t]) assetTotals[t] = { available: 0, frozen: 0 }
    assetTotals[t].available += parseFloat((a as any).available_balance || 0)
    assetTotals[t].frozen += parseFloat((a as any).frozen_balance || 0)
  }

  // 近7天趋势（按注册日期分组）
  const trends: Record<string, { invites: number; activated: number }> = {}
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    trends[d.toISOString().slice(0, 10)] = { invites: 0, activated: 0 }
  }
  for (const r of relations) {
    const d = String((r as any).created_at || "").slice(0, 10)
    if (trends[d]) trends[d].invites++
    if ((r as any).activated_at) {
      const ad = String((r as any).activated_at).slice(0, 10)
      if (trends[ad]) trends[ad].activated++
    }
  }

  return {
    funnel: {
      totalClicks,
      totalInvites: relations.length,
      totalActivated: activated.length,
      conversionRate: relations.length > 0 ? parseFloat(((relations.length / Math.max(totalClicks, 1)) * 100).toFixed(2)) : 0,
      activationRate: relations.length > 0 ? parseFloat(((activated.length / relations.length) * 100).toFixed(2)) : 0,
    },
    trends: Object.entries(trends).map(([date, v]) => ({ date, ...v })),
    pendingWithdrawals: { count: pending.length, amount: pending.reduce((s: number, w: any) => s + parseFloat(w.amount || 0), 0) },
    assetTotals,
  }
}

// ── 裂变关系列表 ──────────────────────────────────────
export async function getFissionRelations(params: { page?: number; limit?: number; status?: string; search?: string }) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(50, params.limit || 10)

  if (isCN()) {
    const db = await getCB()
    try {
      const r = await db.collection("referral_relations").get()
      let rows = Array.isArray(r?.data) ? r.data : []
      if (params.status && params.status !== "all") rows = rows.filter((x: any) => x.status === params.status)
      return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit }
    } catch { return { rows: [], total: 0, page, limit } }
  }

  const sb = await getSB()
  let q = sb.from("referral_relations").select("*", { count: "exact" }).order("created_at", { ascending: false })
  if (params.status && params.status !== "all") q = q.eq("status", params.status)
  q = q.range((page - 1) * limit, page * limit - 1)
  const { data, count, error } = await q
  if (error) return { rows: [], total: 0, page, limit }
  return { rows: data || [], total: count || 0, page, limit }
}

// ── 用户资产列表 ──────────────────────────────────────
export async function getAssetAccounts(params: { page?: number; limit?: number; query?: string }) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(50, params.limit || 10)

  if (isCN()) {
    const db = await getCB()
    try {
      const r = await db.collection("market_asset_accounts").get()
      const rows = Array.isArray(r?.data) ? r.data : []
      return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit }
    } catch { return { rows: [], total: 0, page, limit } }
  }

  const sb = await getSB()
  let q = sb.from("market_asset_accounts").select("*, users!inner(id,email)", { count: "exact" }).order("created_at", { ascending: false })
  if (params.query) q = q.ilike("user_id", `%${params.query}%`)
  q = q.range((page - 1) * limit, page * limit - 1)
  const { data, count, error } = await q
  if (error) return { rows: [], total: 0, page, limit }
  return { rows: data || [], total: count || 0, page, limit }
}

// ── 资产流水 ──────────────────────────────────────────
export async function getAssetLedgers(params: { page?: number; limit?: number; assetType?: string }) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(50, params.limit || 10)

  if (isCN()) {
    const db = await getCB()
    try {
      const r = await db.collection("market_asset_ledgers").get()
      let rows = Array.isArray(r?.data) ? r.data : []
      if (params.assetType && params.assetType !== "all") rows = rows.filter((x: any) => x.asset_type === params.assetType)
      return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit }
    } catch { return { rows: [], total: 0, page, limit } }
  }

  const sb = await getSB()
  let q = sb.from("market_asset_ledgers").select("*", { count: "exact" }).order("created_at", { ascending: false })
  if (params.assetType && params.assetType !== "all") q = q.eq("asset_type", params.assetType)
  q = q.range((page - 1) * limit, page * limit - 1)
  const { data, count, error } = await q
  if (error) return { rows: [], total: 0, page, limit }
  return { rows: data || [], total: count || 0, page, limit }
}

// ── 资产调账 ──────────────────────────────────────────
export async function adjustAsset(params: { userId: string; assetType: string; amount: number; remark: string; operator: string }) {
  const id = `led-${randomUUID().slice(0, 8)}`
  const direction = params.amount >= 0 ? "credit" : "debit"
  const absAmount = Math.abs(params.amount)

  if (isCN()) {
    const db = await getCB()
    await db.collection("market_asset_ledgers").add({ id, user_id: params.userId, asset_type: params.assetType, direction, amount: absAmount, source_type: "manual_adjust", remark: params.remark, created_at: now() })
    // 更新账户余额
    const r = await db.collection("market_asset_accounts").where({ user_id: params.userId, asset_type: params.assetType }).get()
    if (r?.data?.[0]) {
      const cur = parseFloat(r.data[0].available_balance || 0)
      await db.collection("market_asset_accounts").doc(r.data[0]._id).update({ available_balance: cur + params.amount, updated_at: now() })
    } else {
      await db.collection("market_asset_accounts").add({ id: `acc-${randomUUID().slice(0,8)}`, user_id: params.userId, asset_type: params.assetType, available_balance: params.amount, frozen_balance: 0, lifetime_earned: Math.max(0, params.amount), created_at: now(), updated_at: now() })
    }
    return true
  }

  const sb = await getSB()
  await sb.from("market_asset_ledgers").insert({ id, user_id: params.userId, asset_type: params.assetType, direction, amount: absAmount, source_type: "manual_adjust", remark: params.remark, created_at: now() })
  const { data: acc } = await sb.from("market_asset_accounts").select("*").eq("user_id", params.userId).eq("asset_type", params.assetType).maybeSingle()
  if (acc) {
    await sb.from("market_asset_accounts").update({ available_balance: parseFloat(acc.available_balance || 0) + params.amount, updated_at: now() }).eq("id", acc.id)
  } else {
    await sb.from("market_asset_accounts").insert({ id: `acc-${randomUUID().slice(0,8)}`, user_id: params.userId, asset_type: params.assetType, available_balance: params.amount, frozen_balance: 0, lifetime_earned: Math.max(0, params.amount), created_at: now(), updated_at: now() })
  }
  return true
}

// ── 提现列表 ──────────────────────────────────────────
export async function getWithdrawals(params: { page?: number; limit?: number; status?: string }) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(50, params.limit || 10)

  if (isCN()) {
    const db = await getCB()
    try {
      const r = await db.collection("market_withdrawals").get()
      let rows = Array.isArray(r?.data) ? r.data : []
      if (params.status && params.status !== "all") rows = rows.filter((x: any) => x.status === params.status)
      return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit }
    } catch { return { rows: [], total: 0, page, limit } }
  }

  const sb = await getSB()
  let q = sb.from("market_withdrawals").select("*", { count: "exact" }).order("created_at", { ascending: false })
  if (params.status && params.status !== "all") q = q.eq("status", params.status)
  q = q.range((page - 1) * limit, page * limit - 1)
  const { data, count, error } = await q
  if (error) return { rows: [], total: 0, page, limit }
  return { rows: data || [], total: count || 0, page, limit }
}

// ── 审核提现 ──────────────────────────────────────────
export async function reviewWithdrawal(params: { id: string; action: "approve" | "reject"; note: string; operator: string }) {
  const patch = { status: params.action === "approve" ? "approved" : "rejected", review_note: params.note, reviewed_by: params.operator, reviewed_at: now() }
  if (isCN()) {
    const db = await getCB()
    await db.collection("market_withdrawals").where({ id: params.id }).update(patch)
    return true
  }
  const sb = await getSB()
  await sb.from("market_withdrawals").update(patch).eq("id", params.id)
  return true
}

// ── 用户邀请中心数据（用户端） ────────────────────────
export async function getUserInviteData(userId: string) {
  if (isCN()) {
    const db = await getCB()
    try {
      const [userR, relR, linkR] = await Promise.all([
        db.collection("users").where({ id: userId }).get(),
        db.collection("referral_relations").where({ inviter_user_id: userId }).get(),
        db.collection("referral_links").where({ creator_user_id: userId }).get(),
      ])
      const user = userR?.data?.[0]
      const relations = Array.isArray(relR?.data) ? relR.data : []
      const links = Array.isArray(linkR?.data) ? linkR.data : []
      const referralCode = user?.referral_code || ""
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      return {
        referralCode,
        shareUrl: referralCode ? `${baseUrl}/r/${referralCode}` : "",
        clickCount: links.reduce((s: number, l: any) => s + (l.click_count || 0), 0),
        invitedCount: relations.length,
        activatedCount: relations.filter((r: any) => r.activated_at).length,
      }
    } catch { return { referralCode: "", shareUrl: "", clickCount: 0, invitedCount: 0, activatedCount: 0 } }
  }

  const sb = await getSB()
  const [{ data: user }, { data: relations }, { data: links }] = await Promise.all([
    sb.from("users").select("referral_code").eq("id", userId).maybeSingle(),
    sb.from("referral_relations").select("*").eq("inviter_user_id", userId),
    sb.from("referral_links").select("click_count").eq("creator_user_id", userId),
  ])
  const referralCode = (user as any)?.referral_code || ""
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return {
    referralCode,
    shareUrl: referralCode ? `${baseUrl}/r/${referralCode}` : "",
    clickCount: (links || []).reduce((s: number, l: any) => s + (l.click_count || 0), 0),
    invitedCount: (relations || []).length,
    activatedCount: (relations || []).filter((r: any) => r.activated_at).length,
  }
}
