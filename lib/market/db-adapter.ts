import { createClient } from "@supabase/supabase-js"
// 复用统一的 Supabase 单例（带重试 + TLS 兼容），避免重复创建客户端
import { getSupabase as getSharedSupabase } from "@/lib/db-adapter"

// 动态导入 CloudBase SDK，只在服务端使用
let cloudbase: any = null
if (typeof window === 'undefined') {
  cloudbase = require("@cloudbase/node-sdk")
}

// Node.js 模块只在服务端使用，动态导入避免客户端打包报错
let readFile: any, writeFile: any, mkdir: any, nodePath: any
if (typeof window === 'undefined') {
  const fs = require('fs/promises')
  readFile = fs.readFile
  writeFile = fs.writeFile
  mkdir = fs.mkdir
  nodePath = require('path')
}

// ==========================================
// Types
// ==========================================
type RawRow = Record<string, any>
export type DeploymentRegion = "CN" | "INTL"

// ==========================================
// Config & Helpers
// ==========================================
// 根据环境变量动态决定区域，不再硬编码
function getRegion(): DeploymentRegion {
  const r = (process.env.NEXT_PUBLIC_SITE_REGION || process.env.SITE_REGION || "intl").toLowerCase()
  return r === "cn" ? "CN" : "INTL"
}

const DATA_DIR = typeof window === 'undefined' ? require('path').join(process.cwd(), "data", "acquisition") : ""

function nowIso() {
  return new Date().toISOString()
}

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

function normalizeKeys(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[camelToSnake(k)] = v
  }
  return result
}

// ==========================================
// Supabase (INTL)
// ==========================================
let supabaseInstance: any = null
function getSupabase() {
  // 优先复用 lib/db-adapter 中已经配置好重试和 TLS 兼容的共享单例
  try {
    const shared = getSharedSupabase()
    if (shared) {
      supabaseInstance = shared
      return shared
    }
  } catch (_) {
    // 共享单例创建失败（通常是环境变量缺失），退回到本文件原有的创建逻辑
  }
  if (supabaseInstance) return supabaseInstance
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  if (!url || !key) return null
  supabaseInstance = createClient(url, key)
  return supabaseInstance
}

// ==========================================
// CloudBase (CN)
// ==========================================
let cloudbaseInstance: any = null
function getCloudBase() {
  if (cloudbaseInstance) return cloudbaseInstance
  
  // ============================================================
  // ⚠️ 强制锁定：必须且只能连接到指定的腾讯云数据库环境
  // ============================================================
  const envId     = process.env.CLOUDBASE_ENV_ID     || ""
  const secretId  = process.env.CLOUDBASE_SECRET_ID  || ""
  const secretKey = process.env.CLOUDBASE_SECRET_KEY || ""
  
  try {
    console.log(`[Database] 强制连接腾讯云环境: ${envId}`)
    const app = cloudbase.init({
      env: envId,
      secretId,
      secretKey,
    })
    cloudbaseInstance = app.database()
    return cloudbaseInstance
  } catch (error) {
    console.error("[Database] CloudBase 强制连接失败:", error)
    return null
  }
}

// ==========================================
// Local File (Fallback)
// ==========================================
async function ensureLocalDir() {
  if (typeof window === 'undefined') {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

async function readLocalRows(table: string): Promise<RawRow[]> {
  if (typeof window === 'undefined') {
    await ensureLocalDir()
    const filePath = require('path').join(DATA_DIR, `${table}.json`)
    try {
      const raw = await readFile(filePath, "utf8")
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return []
}

async function writeLocalRows(table: string, rows: RawRow[]) {
  if (typeof window === 'undefined') {
    await ensureLocalDir()
    const filePath = require('path').join(DATA_DIR, `${table}.json`)
    await writeFile(filePath, JSON.stringify(rows, null, 2), "utf8")
  }
}

// ==========================================
// Unified Adapter
// ==========================================
export const dbAdapter = {
  async loadRows(table: string, filters: RawRow = {}): Promise<RawRow[]> {
    const REGION = getRegion()
    // 1. Try Supabase if in INTL region
    if (REGION === "INTL") {
      const supabase = getSupabase()
      if (supabase) {
        try {
          let query = supabase.from(table).select("*").order("created_at", { ascending: false })
          const normalizedFilters = normalizeKeys(filters)
          for (const [k, v] of Object.entries(normalizedFilters)) query = query.eq(k, v)
          const { data, error } = await query
          if (error) {
            console.error(`[DB] 查询 ${table} 错误:`, error.message)
          } else if (data) {
            return data
          }
        } catch (error) {
          console.error(`[DB] 查询 ${table} 异常:`, error)
        }
      }
    }

    // 2. Try CloudBase if in CN region
    if (REGION === "CN") {
      const db = getCloudBase()
      if (db) {
        try {
          const res = await db.collection(table).where(filters).get()
          if (Array.isArray(res.data)) {
            return res.data
          }
        } catch (err) {
          console.error(`[DB] CloudBase 查询 ${table} 错误:`, err)
        }
      }
    }

    // 3. Fallback to Local File
    const rows = await readLocalRows(table)
    // 本地文件通常使用 id 字段，但路由可能使用 user_id 过滤
    // 兼容处理：如果过滤条件中包含 user_id，也同时匹配 id 字段
    const normalizedFilters = { ...filters }
    if (normalizedFilters.user_id && !normalizedFilters.id) {
      normalizedFilters.id = normalizedFilters.user_id
    }
    const filteredRows = rows.filter(r => Object.entries(normalizedFilters).every(([k, v]) => r[k] === v))
    return filteredRows
  },

  async insertRow(table: string, row: RawRow): Promise<RawRow> {
    const REGION = getRegion()
    const now = nowIso()
    const finalRow = { ...row, created_at: now, updated_at: now }

    if (REGION === "INTL") {
      const supabase = getSupabase()
      if (supabase) {
        const { data, error } = await supabase.from(table).insert(normalizeKeys(finalRow)).select("*").maybeSingle()
        if (error) {
          console.error(`[Supabase] insertRow ${table}:`, error.message)
          // 如果表不存在，尝试创建表
          if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            console.warn(`[Supabase] Table ${table} does not exist, creating...`)
            try {
              // 创建表的简化版本
              await supabase.rpc('create_overseas_customers_table')
              // 重新插入
              const { data: retryData, error: retryError } = await supabase.from(table).insert(normalizeKeys(finalRow)).select("*").maybeSingle()
              if (retryError) {
                console.error(`[Supabase] Retry insertRow ${table}:`, retryError.message)
              } else {
                return retryData ?? finalRow
              }
            } catch (createError) {
              console.error(`[Supabase] Failed to create table ${table}:`, createError)
            }
          }
        } else {
          return data ?? finalRow
        }
      }
    }

    if (REGION === "CN") {
      const db = getCloudBase()
      if (db) {
        try {
          await db.collection(table).add(finalRow)
          return finalRow
        } catch (err: any) {
          // 仅当是集合不存在错误时才尝试创建集合
          const isNotExist = err.message?.includes("not exist") || err.code?.includes("NOT_EXIST")
          // 排除掉环境不存在的情况 (100003 是 CloudBase 环境不存在的错误码)
          const isEnvError = err.message?.includes("env not exists") || err.code === "INVALID_ENV" || err.message?.includes("100003")
          
          if (isNotExist && !isEnvError) {
            try {
              await db.createCollection(table)
              await db.collection(table).add(finalRow)
              return finalRow
            } catch (createErr) {
              console.error(`CloudBase createCollection error for ${table}:`, createErr)
            }
          } else {
            console.error(`CloudBase insertRow error for ${table}:`, err)
          }
        }
      }
    }

    // Local fallback
    const rows = await readLocalRows(table)
    rows.unshift(finalRow)
    await writeLocalRows(table, rows)
    return finalRow
  },

  async updateRow(table: string, filters: RawRow, patch: RawRow): Promise<RawRow | null> {
    const REGION = getRegion()
    const now = nowIso()
    const finalPatch = { ...patch, updated_at: now }

    if (REGION === "INTL") {
      const supabase = getSupabase()
      if (supabase) {
        let query = supabase.from(table).update(normalizeKeys(finalPatch)).select("*")
        const normalizedFilters = normalizeKeys(filters)
        for (const [k, v] of Object.entries(normalizedFilters)) query = query.eq(k, v)
        const { data, error } = await query.maybeSingle()
        if (!error && data) return data
      }
    }

    if (REGION === "CN") {
      const db = getCloudBase()
      if (db) {
        try {
          const collection = db.collection(table)
          const res = await collection.where(filters).get()
          if (res.data?.[0]?._id) {
            await collection.doc(res.data[0]._id).update(finalPatch)
            return { ...res.data[0], ...finalPatch }
          }
        } catch (err) {
          console.error(`CloudBase updateRow error for ${table}:`, err)
        }
      }
    }

    // Local fallback
    const rows = await readLocalRows(table)
    const normalizedFilters = { ...filters }
    if (normalizedFilters.user_id && !normalizedFilters.id) {
      normalizedFilters.id = normalizedFilters.user_id
    }
    const index = rows.findIndex(r => Object.entries(normalizedFilters).every(([k, v]) => r[k] === v))
    if (index === -1) return null
    rows[index] = { ...rows[index], ...finalPatch }
    await writeLocalRows(table, rows)
    return rows[index]
  },

  async deleteRow(table: string, filters: RawRow): Promise<boolean> {
    const REGION = getRegion()
    if (REGION === "INTL") {
      const supabase = getSupabase()
      if (supabase) {
        let query = supabase.from(table).delete()
        const normalizedFilters = normalizeKeys(filters)
        for (const [k, v] of Object.entries(normalizedFilters)) query = query.eq(k, v)
        const { error } = await query
        return !error
      }
    }

    if (REGION === "CN") {
      const db = getCloudBase()
      if (db) {
        try {
          const collection = db.collection(table)
          const res = await collection.where(filters).remove()
          return res.deleted > 0
        } catch (err) {
          console.error(`CloudBase deleteRow error for ${table}:`, err)
        }
      }
    }

    // Local fallback
    const rows = await readLocalRows(table)
    const normalizedFilters = { ...filters }
    if (normalizedFilters.user_id && !normalizedFilters.id) {
      normalizedFilters.id = normalizedFilters.user_id
    }
    const initialLen = rows.length
    const filtered = rows.filter(r => !Object.entries(normalizedFilters).every(([k, v]) => r[k] === v))
    if (filtered.length === initialLen) return false
    await writeLocalRows(table, filtered)
    return true
  }
}
