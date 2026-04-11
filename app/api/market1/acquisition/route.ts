import { NextRequest, NextResponse } from "next/server"
import { readSessionFromRequest } from "@/lib/market1/admin-auth"
import { randomUUID } from "crypto"

export const runtime = "nodejs"

function now() { return new Date().toISOString() }

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getCB() {
  const cb = await import("@cloudbase/node-sdk")
  const app = cb.init({ env: process.env.CLOUDBASE_ENV_ID!, secretId: process.env.CLOUDBASE_SECRET_ID!, secretKey: process.env.CLOUDBASE_SECRET_KEY! })
  return app.database()
}

const isCN = () => (process.env.NEXT_PUBLIC_SITE_REGION || "intl").toLowerCase() === "cn"

// ── generic DB helpers ────────────────────────────────
async function dbInsert(table: string, row: Record<string, any>) {
  const id = `${table.slice(0,3)}-${randomUUID().slice(0,8)}`
  const data = { id, ...row, created_at: now(), updated_at: now() }
  if (isCN()) {
    const db = await getCB()
    await db.collection(table).add(data)
    return data
  }
  const sb = await getSupabase()
  const { data: r, error } = await sb.from(table).insert(data).select().single()
  if (error) throw new Error(error.message)
  return r
}

async function dbDelete(table: string, id: string) {
  if (isCN()) {
    const db = await getCB()
    await db.collection(table).where({ id }).remove()
    return true
  }
  const sb = await getSupabase()
  await sb.from(table).delete().eq("id", id)
  return true
}

async function dbUpdate(table: string, id: string, patch: Record<string, any>) {
  const data = { ...patch, updated_at: now() }
  if (isCN()) {
    const db = await getCB()
    await db.collection(table).where({ id }).update(data)
    return true
  }
  const sb = await getSupabase()
  await sb.from(table).update(data).eq("id", id)
  return true
}

async function dbList(table: string) {
  if (isCN()) {
    const db = await getCB()
    try { const r = await db.collection(table).get(); return Array.isArray(r?.data) ? r.data : [] }
    catch (e: any) { if (String(e?.message||"").includes("not exist")) return []; throw e }
  }
  const sb = await getSupabase()
  const { data, error } = await sb.from(table).select("*").order("created_at", { ascending: false })
  if (error) { if (error.code === "42P01") return []; throw new Error(error.message) }
  return data || []
}

// ── GET: load all data ────────────────────────────────
export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const [bloggers, b2bLeads, vcLeads, ads, verifyRequests] = await Promise.all([
      dbList("acquisition_bloggers"),
      dbList("acquisition_b2b_leads"),
      dbList("acquisition_vc_leads"),
      dbList("acquisition_ads"),
      dbList("market1_verify_requests"),
    ])
    return NextResponse.json({ success: true, data: { bloggers, b2bLeads, vcLeads, ads, verifyRequests } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

// ── POST: actions ─────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = readSessionFromRequest(request)
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const action = String(body.action || "")

    // ── 博主 ──
    if (action === "insert_blogger") {
      const r = await dbInsert("acquisition_bloggers", {
        name: String(body.name || ""), platform: String(body.platform || ""),
        followers: String(body.followers || ""), email: String(body.email || ""),
        cost: String(body.cost || ""), commission: String(body.commission || ""),
        status: "未联系", user_id: "admin",
      })
      return NextResponse.json({ success: true, result: r })
    }
    if (action === "delete_blogger") {
      await dbDelete("acquisition_bloggers", String(body.id || ""))
      return NextResponse.json({ success: true })
    }

    // ── B2B ──
    if (action === "insert_b2b") {
      const r = await dbInsert("acquisition_b2b_leads", {
        name: String(body.name || ""), region: String(body.region || ""),
        contact: String(body.contact || ""), email: String(body.email || ""),
        est_value: String(body.estValue || ""), source: "手工录入",
        status: "初步接触", type: "follow", user_id: "admin",
      })
      return NextResponse.json({ success: true, result: r })
    }
    if (action === "delete_b2b") {
      await dbDelete("acquisition_b2b_leads", String(body.id || ""))
      return NextResponse.json({ success: true })
    }

    // ── VC ──
    if (action === "insert_vc") {
      const r = await dbInsert("acquisition_vc_leads", {
        name: String(body.name || ""), region: String(body.region || ""),
        contact: String(body.contact || ""), email: String(body.email || ""),
        focus: String(body.focus || ""), source: "手工录入",
        status: "待联系", type: "follow", user_id: "admin",
      })
      return NextResponse.json({ success: true, result: r })
    }
    if (action === "delete_vc") {
      await dbDelete("acquisition_vc_leads", String(body.id || ""))
      return NextResponse.json({ success: true })
    }

    // ── 广告 ──
    if (action === "insert_ad") {
      const r = await dbInsert("acquisition_ads", {
        brand: String(body.brand || ""), type: String(body.type || ""),
        duration: String(body.duration || ""), reward: String(body.reward || ""),
        status: "待审核", views: 0, user_id: "admin",
      })
      return NextResponse.json({ success: true, result: r })
    }
    if (action === "delete_ad") {
      await dbDelete("acquisition_ads", String(body.id || ""))
      return NextResponse.json({ success: true })
    }

    // ── 认证审核 ──
    if (action === "approve_verify") {
      await dbUpdate("market1_verify_requests", String(body.id || ""), { status: "approved", reviewed_by: session.username, reviewed_at: now() })
      // 同步更新用户认证状态
      if (body.userId && body.verifyType) {
        const field = body.verifyType === "influencer" ? "is_influencer_verified" : "is_merchant_verified"
        await dbUpdate("user_market_profiles", String(body.userId), { [field]: true })
      }
      return NextResponse.json({ success: true })
    }
    if (action === "reject_verify") {
      await dbUpdate("market1_verify_requests", String(body.id || ""), { status: "rejected", reviewed_by: session.username, reviewed_at: now(), reject_reason: String(body.reason || "") })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
