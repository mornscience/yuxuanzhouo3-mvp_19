/**
 * 统一数据库适配器
 * 国内（NEXT_PUBLIC_SITE_REGION=cn）→ 腾讯云 CloudBase
 * 国际（其他）→ Supabase
 *
 * 通过环境变量 NEXT_PUBLIC_SITE_REGION 控制，默认 cn
 */

// ── 判断当前区域 ──────────────────────────────────────
export function isCN(): boolean {
  const region = process.env.NEXT_PUBLIC_SITE_REGION || process.env.SITE_REGION || "intl"
  return region.toLowerCase() === "cn"
}

function nowIso() {
  return new Date().toISOString()
}

// ══════════════════════════════════════════════════════
// CloudBase（国内）
// ══════════════════════════════════════════════════════
import * as cloudbase from "@cloudbase/node-sdk"

const CLOUDBASE_CONFIG = {
  envId:     process.env.CLOUDBASE_ENV_ID     || "",
  secretId:  process.env.CLOUDBASE_SECRET_ID  || "",
  secretKey: process.env.CLOUDBASE_SECRET_KEY || "",
}

let _cbDB: any = null
function getCloudBaseDB() {
  if (_cbDB) return _cbDB
  const app = cloudbase.init({
    env:       CLOUDBASE_CONFIG.envId,
    secretId:  CLOUDBASE_CONFIG.secretId,
    secretKey: CLOUDBASE_CONFIG.secretKey,
  })
  _cbDB = app.database()
  return _cbDB
}

// CloudBase CRUD
const cbAdapter = {
  async loadRows(table: string, filters: Record<string, any> = {}): Promise<any[]> {
    const db = getCloudBaseDB()
    try {
      const res = await db.collection(table).where(filters).get()
      return Array.isArray(res.data) ? res.data : []
    } catch (err: any) {
      if (err.message?.includes("not exist") || err.code?.includes("NOT_EXIST")) return []
      throw err
    }
  },

  async insertRow(table: string, row: Record<string, any>): Promise<any> {
    const db = getCloudBaseDB()
    const now = nowIso()
    const finalRow = { ...row, created_at: now, updated_at: now }
    try {
      const result = await db.collection(table).add(finalRow)
      return { ...finalRow, _id: result._id }
    } catch (err: any) {
      const isNotExist = err.message?.includes("not exist") || err.code?.includes("NOT_EXIST")
      const isEnvError = err.message?.includes("env not exists") || err.code === "INVALID_ENV"
      if (isNotExist && !isEnvError) {
        await db.createCollection(table)
        const result = await db.collection(table).add(finalRow)
        return { ...finalRow, _id: result._id }
      }
      throw err
    }
  },

  async updateRow(table: string, filters: Record<string, any>, patch: Record<string, any>): Promise<any | null> {
    const db = getCloudBaseDB()
    const finalPatch = { ...patch, updated_at: nowIso() }
    const res = await db.collection(table).where(filters).get()
    if (res.data?.[0]?._id) {
      await db.collection(table).doc(res.data[0]._id).update(finalPatch)
      return { ...res.data[0], ...finalPatch }
    }
    return null
  },

  async deleteRow(table: string, filters: Record<string, any>): Promise<boolean> {
    const db = getCloudBaseDB()
    const res = await db.collection(table).where(filters).remove()
    return res.deleted > 0
  },
}

// ══════════════════════════════════════════════════════
// Supabase（国际）
// ══════════════════════════════════════════════════════
import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase 环境变量未配置：NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  _supabase = createClient(url, key)
  return _supabase
}

// Supabase CRUD
// 驼峰转下划线：userId → user_id, fullName → full_name
function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// 写入时将驼峰命名转换为下划线命名（Supabase 表列名为 snake_case）
function normalizeFilters(filters: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(filters)) {
    const snakeKey = camelToSnake(k);
    result[snakeKey] = v;
  }
  return result;
}

// 小写转驼峰：isinfluencerverified → isInfluencerVerified, user_id → userId
function toCamelCase(str: string): string {
  // 已经是驼峰或含大写则不处理
  if (/[A-Z]/.test(str)) return str
  
  // 处理带下划线的情况：user_id → userId
  if (str.includes('_')) {
    return str.split('_').map((word, index) => {
      if (index === 0) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    }).join('')
  }
  
  // 纯小写且无下划线：尝试从已知驼峰映射还原
  return CAMEL_MAP[str] ?? str
}

// 已知的驼峰字段映射表（小写 → 驼峰）
const CAMEL_MAP: Record<string, string> = {
  userid: "userId",
  user_id: "userId",
  isrealnnameverified: "isRealNameVerified",
  isrealnameverified: "isRealNameVerified",
  isinfluencerverified: "isInfluencerVerified",
  ismerchantverified: "isMerchantVerified",
  isrealinfluencer: "isRealInfluencer",
  isrealmerchant: "isRealMerchant",
  adviewscount: "adViewsCount",
  totalearnings: "totalEarnings",
  platformaccount: "platformAccount",
  platformhomeurl: "platformHomeUrl",
  companyname: "companyName",
  creditcode: "creditCode",
  businesslicenseurl: "businessLicenseUrl",
  brandname: "brandName",
  contactperson: "contactPerson",
  contactphone: "contactPhone",
  fullname: "fullName",
  idnumber: "idNumber",
  createdat: "createdAt",
  updatedat: "updatedAt",
  created_at: "created_at",  // 保留下划线格式
  updated_at: "updated_at",
  googleid: "googleId",
  wechatid: "wechatId",
  leadownerid: "leadOwnerId",
  applicantid: "applicantId",
  applicantname: "applicantName",
  applicantcontact: "applicantContact",
  applicantemail: "applicantEmail",
  applicantvisible: "applicantVisible",
  leadtype: "leadType",
  leadid: "leadId",
  cooperationcount: "cooperationCount",
  publishat: "publishAt",
  ispublic: "isPublic",
  estvalue: "estValue",  // 注意：数据库存的是 est_value
  fundingamount: "fundingAmount",
  fundingstage: "fundingStage",
  fromapplicationid: "fromApplicationId",
  rewardearned: "rewardEarned",
  completedat: "completedAt",
  orderid: "orderId",
  videurl: "videoUrl",
  videourl: "videoUrl",
  adviewcount: "adViewsCount",
}

function restoreCamelCase(row: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [k, v] of Object.entries(row)) {
    result[toCamelCase(k)] = v
  }
  return result
}

function restoreRows(rows: any[]): any[] {
  return rows.map(r => restoreCamelCase(r))
}

const sbAdapter = {
  async loadRows(table: string, filters: Record<string, any> = {}): Promise<any[]> {
    const sb = getSupabase()
    const normalized = normalizeFilters(filters)
    let query = sb.from(table).select("*")
    for (const [k, v] of Object.entries(normalized)) {
      if (v === undefined || v === null) continue
      query = query.eq(k, v)
    }
    // 无 filter 时加 neq 避免 PostgREST 空查询问题
    const hasFilters = Object.keys(normalized).length > 0
    if (!hasFilters) {
      query = (query as any).gt("id", "")
    }
    const { data, error } = await query
    if (error) {
      if (error.code === "42P01") return []
      throw new Error(`[Supabase] loadRows ${table}: ${error.message}`)
    }
    return restoreRows(data || [])
  },

  async insertRow(table: string, row: Record<string, any>): Promise<any> {
    const sb = getSupabase()
    const now = nowIso()
    const { randomUUID } = await import("crypto")
    // 列名统一转下划线
    const normalizedRow = normalizeFilters(row)
    const finalRow = {
      id: randomUUID(),
      ...normalizedRow,
      created_at: now,
      updated_at: now,
    }
    console.log(`[Supabase] insertRow ${table}`, JSON.stringify(finalRow).slice(0, 200))
    const { data, error } = await sb.from(table).insert(finalRow).select().single()
    if (error) throw new Error(`[Supabase] insertRow ${table}: ${error.message}`)
    return restoreCamelCase(data)
  },

  async updateRow(table: string, filters: Record<string, any>, patch: Record<string, any>): Promise<any | null> {
    const sb = getSupabase()
    const normalizedFilters = normalizeFilters(filters)
    const normalizedPatch = { ...normalizeFilters(patch), updated_at: nowIso() }
    let query = sb.from(table).select("*")
    for (const [k, v] of Object.entries(normalizedFilters)) {
      if (v === undefined || v === null) continue
      query = query.eq(k, v)
    }
    const { data: rows } = await query.limit(1)
    if (!rows || rows.length === 0) return null

    const pkVal = rows[0].id || rows[0]._id
    const pkCol = rows[0].id !== undefined ? "id" : "_id"
    const { data, error } = await sb.from(table).update(normalizedPatch).eq(pkCol, pkVal).select().single()
    if (error) throw new Error(`[Supabase] updateRow ${table}: ${error.message}`)
    return restoreCamelCase(data)
  },

  async deleteRow(table: string, filters: Record<string, any>): Promise<boolean> {
    const sb = getSupabase()
    const normalized = normalizeFilters(filters)
    let query = sb.from(table).delete()
    for (const [k, v] of Object.entries(normalized)) {
      if (v === undefined || v === null) continue
      query = query.eq(k, v)
    }
    const { error, count } = await query
    if (error) throw new Error(`[Supabase] deleteRow ${table}: ${error.message}`)
    return (count ?? 0) > 0
  },
}

// ══════════════════════════════════════════════════════
// 统一导出：根据区域自动路由
// ══════════════════════════════════════════════════════
export const dbAdapter = {
  async loadRows(table: string, filters: Record<string, any> = {}): Promise<any[]> {
    return isCN()
      ? cbAdapter.loadRows(table, filters)
      : sbAdapter.loadRows(table, filters)
  },

  async insertRow(table: string, row: Record<string, any>): Promise<any> {
    return isCN()
      ? cbAdapter.insertRow(table, row)
      : sbAdapter.insertRow(table, row)
  },

  async updateRow(table: string, filters: Record<string, any>, patch: Record<string, any>): Promise<any | null> {
    return isCN()
      ? cbAdapter.updateRow(table, filters, patch)
      : sbAdapter.updateRow(table, filters, patch)
  },

  async deleteRow(table: string, filters: Record<string, any>): Promise<boolean> {
    return isCN()
      ? cbAdapter.deleteRow(table, filters)
      : sbAdapter.deleteRow(table, filters)
  },

  async loadSingleRow(table: string, filters: Record<string, any> = {}): Promise<any | null> {
    const rows = await this.loadRows(table, filters)
    return rows.length > 0 ? rows[0] : null
  },

  /** 当前使用的数据库类型，方便调试 */
  get region(): "cn" | "intl" {
    return isCN() ? "cn" : "intl"
  },

  /** 上传文件（仅 CloudBase 支持，Supabase 用 Storage 另行实现） */
  async uploadFile(cloudPath: string, fileContent: Buffer): Promise<string> {
    if (!isCN()) {
      throw new Error("国际版文件上传请使用 Supabase Storage")
    }
    const app = cloudbase.init({
      env:       CLOUDBASE_CONFIG.envId,
      secretId:  CLOUDBASE_CONFIG.secretId,
      secretKey: CLOUDBASE_CONFIG.secretKey,
    })
    await app.uploadFile({ cloudPath, fileContent })
    const BUCKET = process.env.CLOUDBASE_BUCKET_ID || ""
    return `https://${BUCKET}.tcb.qcloud.la/${cloudPath}`
  },
}
