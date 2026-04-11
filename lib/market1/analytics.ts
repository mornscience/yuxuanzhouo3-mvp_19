/**
 * 用户分析系统 — 数据查询层
 * 国内：腾讯云 CloudBase（users / messages 集合）
 * 国外：Supabase（users / messages 表）
 */
import { isCN } from "@/lib/db-adapter"

type DeploymentRegion = "CN" | "INTL"

const MIN_DAYS = 14
const MAX_DAYS = 120
const DEFAULT_DAYS = 30

const FIRST_USE_LATENCY_BUCKETS = [
  { key: "under_1h",  label: "< 1小时",  minHours: 0,   maxHours: 1 },
  { key: "under_24h", label: "1-24小时", minHours: 1,   maxHours: 24 },
  { key: "under_3d",  label: "1-3天",    minHours: 24,  maxHours: 72 },
  { key: "under_7d",  label: "3-7天",    minHours: 72,  maxHours: 168 },
  { key: "over_7d",   label: "> 7天",    minHours: 168, maxHours: Infinity },
] as const

interface AnalyticsUser  { userId: string; createdAt: Date }
interface UsageEvent     { userId: string; createdAt: Date; toolId: string }

// ── helpers ──────────────────────────────────────────
function parseDays(days?: number | string) {
  const n = Number(days)
  if (!Number.isFinite(n)) return DEFAULT_DAYS
  return Math.max(MIN_DAYS, Math.min(MAX_DAYS, Math.floor(n)))
}
function toRate(a: number, b: number) {
  if (!b) return 0
  return Number(((a / b) * 100).toFixed(2))
}
function safe(v: any) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0 }
function parseDate(v: any) {
  if (!v) return null
  const d = new Date(String(v))
  return Number.isFinite(d.getTime()) ? d : null
}
function utcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setUTCDate(r.getUTCDate() + n); return r
}
function toKey(d: Date) { return d.toISOString().slice(0, 10) }
function buildKeys(days: number) {
  const end = utcDay(new Date()); const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) keys.push(toKey(addDays(end, -i)))
  return keys
}
function median(arr: number[]) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2)
  return s.length % 2 ? Number(s[m].toFixed(2)) : Number(((s[m-1]+s[m])/2).toFixed(2))
}
function hourDiff(a: Date, b: Date) { return (b.getTime() - a.getTime()) / 3_600_000 }
function dayDiff(a: Date, b: Date) {
  return Math.floor((utcDay(b).getTime() - utcDay(a).getTime()) / 86_400_000)
}
function toolFromType(t?: string | null) {
  const s = String(t || "").trim().toLowerCase()
  if (!s || s === "text") return "chat"
  return `chat-${s}`
}

// ── data loaders ─────────────────────────────────────
async function loadIntl(): Promise<{ users: AnalyticsUser[]; usageEvents: UsageEvent[] }> {
  const { createClient } = await import("@supabase/supabase-js")
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 并行查询所有业务表作为用户行为事件来源
  const [ur, txr, adpr, aisr] = await Promise.all([
    sb.from("users").select("id,created_at"),
    sb.from("user_transactions").select("user_id,created_at,type").limit(10000),
    sb.from("ad_participations").select("user_id,created_at,status").limit(10000),
    sb.from("ai_search_leads").select("user_id,created_at,type").limit(10000),
  ])

  if (ur.error) throw new Error(ur.error.message)
  // 其他表不存在时静默忽略

  const users: AnalyticsUser[] = []
  for (const r of ur.data || []) {
    const userId = String((r as any).id || "").trim().slice(0, 128)
    const createdAt = parseDate((r as any).created_at)
    if (userId && createdAt) users.push({ userId, createdAt })
  }

  const usageEvents: UsageEvent[] = []

  // 交易记录 → 工具 ID = "wallet-{type}"
  for (const r of txr.data || []) {
    const userId = String((r as any).user_id || "").trim().slice(0, 128)
    const createdAt = parseDate((r as any).created_at)
    if (userId && createdAt) usageEvents.push({ userId, createdAt, toolId: `wallet-${(r as any).type || "tx"}` })
  }

  // 广告任务参与 → 工具 ID = "ad-task"
  for (const r of adpr.data || []) {
    const userId = String((r as any).user_id || "").trim().slice(0, 128)
    const createdAt = parseDate((r as any).created_at)
    if (userId && createdAt) usageEvents.push({ userId, createdAt, toolId: "ad-task" })
  }

  // AI 搜索 → 工具 ID = "ai-search-{type}"
  for (const r of aisr.data || []) {
    const userId = String((r as any).user_id || "").trim().slice(0, 128)
    const createdAt = parseDate((r as any).created_at)
    if (userId && createdAt) usageEvents.push({ userId, createdAt, toolId: `ai-search-${(r as any).type || "search"}` })
  }

  return { users, usageEvents }
}

async function loadCN(): Promise<{ users: AnalyticsUser[]; usageEvents: UsageEvent[] }> {
  const cloudbase = await import("@cloudbase/node-sdk")
  const app = cloudbase.init({
    env: process.env.CLOUDBASE_ENV_ID!,
    secretId: process.env.CLOUDBASE_SECRET_ID!,
    secretKey: process.env.CLOUDBASE_SECRET_KEY!,
  })
  const db = app.database()

  async function safeGet(col: string) {
    try { const r = await db.collection(col).get(); return Array.isArray(r?.data) ? r.data : [] }
    catch (e: any) {
      if (String(e?.message || "").includes("not exist") || String(e?.code || "").includes("NOT_EXIST")) return []
      throw e
    }
  }

  const [uRows, txRows, adRows, aiRows] = await Promise.all([
    safeGet("users"),
    safeGet("user_transactions"),
    safeGet("ad_participations"),
    safeGet("ai_search_leads"),
  ])

  const users: AnalyticsUser[] = []
  for (const r of uRows) {
    const userId = String((r as any).id || (r as any)._id || "").trim().slice(0, 128)
    const createdAt = parseDate((r as any).created_at || (r as any).createdAt)
    if (userId && createdAt) users.push({ userId, createdAt })
  }

  const usageEvents: UsageEvent[] = []
  for (const r of txRows) {
    const userId = String((r as any).user_id || (r as any).userId || "").trim().slice(0, 128)
    const createdAt = parseDate((r as any).created_at || (r as any).createdAt)
    if (userId && createdAt) usageEvents.push({ userId, createdAt, toolId: `wallet-${(r as any).type || "tx"}` })
  }
  for (const r of adRows) {
    const userId = String((r as any).user_id || (r as any).userId || "").trim().slice(0, 128)
    const createdAt = parseDate((r as any).created_at || (r as any).createdAt)
    if (userId && createdAt) usageEvents.push({ userId, createdAt, toolId: "ad-task" })
  }
  for (const r of aiRows) {
    const userId = String((r as any).user_id || (r as any).userId || "").trim().slice(0, 128)
    const createdAt = parseDate((r as any).created_at || (r as any).createdAt)
    if (userId && createdAt) usageEvents.push({ userId, createdAt, toolId: `ai-search-${(r as any).type || "search"}` })
  }

  return { users, usageEvents }
}

// ── core computation ──────────────────────────────────
function compute(params: { region: DeploymentRegion; days: number; users: AnalyticsUser[]; usageEvents: UsageEvent[] }) {
  const days = parseDays(params.days)
  const today = utcDay(new Date())
  const dateKeys = buildKeys(days)
  const dateKeySet = new Set(dateKeys)
  const last7  = addDays(today, -6)
  const last30 = addDays(today, -29)

  const userCreated = new Map<string, Date>()
  for (const u of params.users) if (!userCreated.has(u.userId)) userCreated.set(u.userId, u.createdAt)

  const events = params.usageEvents.filter(e => userCreated.has(e.userId))

  const actDays   = new Map<string, Set<string>>()
  const dauByDate = new Map<string, Set<string>>()
  const evByDate  = new Map<string, number>()
  const totalUse  = new Map<string, number>()
  const lastUse   = new Map<string, Date>()
  const firstUse  = new Map<string, Date>()
  const firstTool = new Map<string, string>()
  const wdEvents  = Array.from({length:7}, () => 0)
  const wdUsers   = Array.from({length:7}, () => new Set<string>())
  const hrEvents  = Array.from({length:24}, () => 0)
  const hrUsers   = Array.from({length:24}, () => new Set<string>())
  const toolMap   = new Map<string, {events:number; users:Set<string>}>()

  for (const e of events) {
    const dk = toKey(e.createdAt)
    ;(actDays.get(e.userId) || (actDays.set(e.userId, new Set()), actDays.get(e.userId)!)).add(dk)
    ;(dauByDate.get(dk) || (dauByDate.set(dk, new Set()), dauByDate.get(dk)!)).add(e.userId)
    evByDate.set(dk, safe(evByDate.get(dk)) + 1)
    totalUse.set(e.userId, safe(totalUse.get(e.userId)) + 1)
    const lu = lastUse.get(e.userId); if (!lu || lu < e.createdAt) lastUse.set(e.userId, e.createdAt)
    const fu = firstUse.get(e.userId); if (!fu || fu > e.createdAt) { firstUse.set(e.userId, e.createdAt); firstTool.set(e.userId, e.toolId || "unknown") }
    const wd = e.createdAt.getUTCDay(); wdEvents[wd]++; wdUsers[wd].add(e.userId)
    const hr = e.createdAt.getUTCHours(); hrEvents[hr]++; hrUsers[hr].add(e.userId)
    const tid = e.toolId || "unknown"
    const tm = toolMap.get(tid) || {events:0, users:new Set<string>()}; tm.events++; tm.users.add(e.userId); toolMap.set(tid, tm)
  }

  const newByDate = new Map<string, number>()
  for (const ca of userCreated.values()) { const k = toKey(ca); if (dateKeySet.has(k)) newByDate.set(k, safe(newByDate.get(k))+1) }
  const fuByDate = new Map<string, number>()
  for (const fa of firstUse.values()) { const k = toKey(fa); if (dateKeySet.has(k)) fuByDate.set(k, safe(fuByDate.get(k))+1) }

  const wauByDate = new Map<string, number>()
  for (let i = 0; i < dateKeys.length; i++) {
    const ws = new Set<string>()
    for (let d = Math.max(0,i-6); d <= i; d++) (dauByDate.get(dateKeys[d]) || new Set()).forEach(u => ws.add(u))
    wauByDate.set(dateKeys[i], ws.size)
  }

  const trends = dateKeys.map(k => ({
    date: k, newUsers: safe(newByDate.get(k)),
    dau: (dauByDate.get(k) || new Set()).size,
    wau: safe(wauByDate.get(k)),
    usageEvents: safe(evByDate.get(k)),
    firstUseUsers: safe(fuByDate.get(k)),
  }))

  const au7 = new Set<string>(), au30 = new Set<string>(), auRange = new Set<string>()
  let ev30 = 0, evRange = 0
  const uc30 = new Map<string, number>()
  for (const e of events) {
    const d = utcDay(e.createdAt)
    if (d >= last7) au7.add(e.userId)
    if (d >= last30) { au30.add(e.userId); ev30++; uc30.set(e.userId, safe(uc30.get(e.userId))+1) }
    if (dateKeySet.has(toKey(d))) { auRange.add(e.userId); evRange++ }
  }

  let nu30 = 0, fu7for30 = 0
  for (const [uid, ca] of userCreated) {
    if (utcDay(ca) < last30) continue; nu30++
    const fa = firstUse.get(uid); if (!fa) continue
    const h = hourDiff(ca, fa); if (h >= 0 && h <= 168) fu7for30++
  }

  const fuHours: number[] = []
  for (const [uid, fa] of firstUse) {
    const ca = userCreated.get(uid); if (!ca) continue
    const h = hourDiff(ca, fa); if (Number.isFinite(h) && h >= 0) fuHours.push(h)
  }

  const overview = {
    totalUsers: userCreated.size,
    newUsersInRange: trends.reduce((s,r) => s+r.newUsers, 0),
    activeUsersInRange: auRange.size,
    activeUsers7d: au7.size,
    activeUsers30d: au30.size,
    activeRate7d: toRate(au7.size, userCreated.size),
    activeRate30d: toRate(au30.size, userCreated.size),
    firstUseRate7dForNewUsers30d: toRate(fu7for30, nu30),
    avgUsageEventsPerActiveUser30d: au30.size ? Number((ev30/au30.size).toFixed(2)) : 0,
    medianFirstUseHours: median(fuHours),
    totalUsageEventsInRange: evRange,
  }

  // cohort
  const cohortStart = addDays(today, -Math.min(29, days-1))
  const cohortMap = new Map<string, {newUsers:number;d1:number;d3:number;d7:number;d14:number;d30:number}>()
  for (const [uid, ca] of userCreated) {
    const cd = utcDay(ca); if (cd < cohortStart || cd > today) continue
    const ck = toKey(cd)
    const c = cohortMap.get(ck) || {newUsers:0,d1:0,d3:0,d7:0,d14:0,d30:0}; c.newUsers++
    const ad = actDays.get(uid) || new Set()
    if (ad.has(toKey(addDays(cd,1))))  c.d1++
    if (ad.has(toKey(addDays(cd,3))))  c.d3++
    if (ad.has(toKey(addDays(cd,7))))  c.d7++
    if (ad.has(toKey(addDays(cd,14)))) c.d14++
    if (ad.has(toKey(addDays(cd,30)))) c.d30++
    cohortMap.set(ck, c)
  }
  const cohorts = Array.from(cohortMap.entries()).map(([cohortDate, v]) => ({
    cohortDate, newUsers: v.newUsers,
    d1Users: v.d1, d3Users: v.d3, d7Users: v.d7, d14Users: v.d14, d30Users: v.d30,
    d1Rate: toRate(v.d1,v.newUsers), d3Rate: toRate(v.d3,v.newUsers),
    d7Rate: toRate(v.d7,v.newUsers), d14Rate: toRate(v.d14,v.newUsers), d30Rate: toRate(v.d30,v.newUsers),
  })).sort((a,b) => a.cohortDate < b.cohortDate ? 1 : -1)

  const rt = cohorts.reduce((a,r) => { a.n+=r.newUsers;a.d1+=r.d1Users;a.d3+=r.d3Users;a.d7+=r.d7Users;a.d14+=r.d14Users;a.d30+=r.d30Users; return a }, {n:0,d1:0,d3:0,d7:0,d14:0,d30:0})
  const retentionSummary = { cohortUsers:rt.n, d1Rate:toRate(rt.d1,rt.n), d3Rate:toRate(rt.d3,rt.n), d7Rate:toRate(rt.d7,rt.n), d14Rate:toRate(rt.d14,rt.n), d30Rate:toRate(rt.d30,rt.n) }

  const wdOrder = [1,2,3,4,5,6,0]
  const wdLabel: Record<number,string> = {0:"周日",1:"周一",2:"周二",3:"周三",4:"周四",5:"周五",6:"周六"}
  const byWeekday = wdOrder.map(w => ({ label:wdLabel[w], events:wdEvents[w], activeUsers:wdUsers[w].size, share:toRate(wdEvents[w],events.length) }))
  const byHour = hrEvents.map((ev,h) => ({ label:`${String(h).padStart(2,"0")}:00`, events:ev, activeUsers:hrUsers[h].size, share:toRate(ev,events.length) }))
  const topTools = Array.from(toolMap.entries()).map(([toolId,v]) => ({ toolId, toolName:toolId, events:v.events, activeUsers:v.users.size, share:toRate(v.events,events.length) })).sort((a,b)=>b.events-a.events).slice(0,12)

  const ftCount = new Map<string,number>()
  for (const t of firstTool.values()) ftCount.set(t, safe(ftCount.get(t))+1)
  const totalFU = firstTool.size
  const firstUseTopTools = Array.from(ftCount.entries()).map(([toolId,users]) => ({ toolId, toolName:toolId, users, share:toRate(users,totalFU) })).sort((a,b)=>b.users-a.users).slice(0,10)

  const latCount = new Map(FIRST_USE_LATENCY_BUCKETS.map(b => [b.key, 0]))
  for (const [uid, fa] of firstUse) {
    const ca = userCreated.get(uid); if (!ca) continue
    const h = hourDiff(ca, fa); if (!Number.isFinite(h) || h < 0) continue
    const b = FIRST_USE_LATENCY_BUCKETS.find(b => h >= b.minHours && h < b.maxHours)
    if (b) latCount.set(b.key, safe(latCount.get(b.key))+1)
  }
  const latencyDistribution = FIRST_USE_LATENCY_BUCKETS.map(b => ({ bucket:b.key, label:b.label, users:safe(latCount.get(b.key)), share:toRate(safe(latCount.get(b.key)),totalFU) }))

  const recSeg = [{key:"active",label:"高活跃（7天内）",users:0},{key:"at_risk",label:"待召回（8-30天）",users:0},{key:"dormant",label:"沉默（30天以上）",users:0},{key:"never",label:"未激活（从未使用）",users:0}]
  const frqSeg = [{key:"0",label:"0次",users:0},{key:"1",label:"1次",users:0},{key:"2-3",label:"2-3次",users:0},{key:"4-7",label:"4-7次",users:0},{key:"8+",label:"8次及以上",users:0}]
  for (const [uid] of userCreated) {
    const lu = lastUse.get(uid)
    if (!lu) recSeg[3].users++
    else { const d = dayDiff(lu,today); if(d<=7) recSeg[0].users++; else if(d<=30) recSeg[1].users++; else recSeg[2].users++ }
    const f = safe(uc30.get(uid))
    if(f<=0) frqSeg[0].users++; else if(f===1) frqSeg[1].users++; else if(f<=3) frqSeg[2].users++; else if(f<=7) frqSeg[3].users++; else frqSeg[4].users++
  }

  return {
    region: params.region, generatedAt: new Date().toISOString(), rangeDays: days,
    overview, retention: { summary: retentionSummary, cohorts }, trends,
    habits: { byWeekday, byHour, topTools },
    firstUse: { topTools: firstUseTopTools, latencyDistribution },
    segmentation: { recency: recSeg.map(s=>({label:s.label,users:s.users,share:toRate(s.users,userCreated.size)})), frequency30d: frqSeg.map(s=>({label:s.label,users:s.users,share:toRate(s.users,userCreated.size)})) },
  }
}

export async function getAnalytics(input?: { days?: number | string }) {
  const days = parseDays(input?.days)
  const region: DeploymentRegion = isCN() ? "CN" : "INTL"
  const data = region === "CN" ? await loadCN() : await loadIntl()
  return compute({ region, days, users: data.users, usageEvents: data.usageEvents })
}
