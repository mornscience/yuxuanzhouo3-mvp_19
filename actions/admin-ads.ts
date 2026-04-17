"use server"

import { createClient } from "@supabase/supabase-js"
import { requireAdminSession } from "@/lib/admin/session"
import type { Advertisement, AdFilters, AdStats, CreateAdData, UpdateAdData } from "@/lib/admin/types"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function listAds(filters: AdFilters = {}) {
  try {
    await requireAdminSession()
    const sb = getSupabase()

    let query = sb.from("advertisements").select("*", { count: "exact" })

    if (filters.status) {
      query = query.eq("status", filters.status)
    }
    if (filters.type) {
      query = query.eq("type", filters.type)
    }
    if (filters.position) {
      query = query.eq("position", filters.position)
    }
    if (filters.search) {
      query = query.ilike("title", `%${filters.search}%`)
    }

    query = query.order("priority", { ascending: false }).order("created_at", { ascending: false })

    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("[listAds] Supabase error:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        items: data || [],
        total: count || 0,
        page: filters.offset ? Math.floor(filters.offset / (filters.limit || 10)) + 1 : 1,
        pageSize: filters.limit || 10,
        totalPages: filters.limit ? Math.ceil((count || 0) / filters.limit) : 1
      }
    }
  } catch (error: any) {
    console.error("[listAds] Error:", error)
    return { success: false, error: error.message || "获取广告列表失败" }
  }
}

export async function getAdStats() {
  try {
    await requireAdminSession()
    const sb = getSupabase()

    const [
      { count: total },
      { count: active },
      { count: inactive },
      { data: adsData }
    ] = await Promise.all([
      sb.from("advertisements").select("*", { count: "exact", head: true }),
      sb.from("advertisements").select("*", { count: "exact", head: true }).eq("status", "active"),
      sb.from("advertisements").select("*", { count: "exact", head: true }).eq("status", "inactive"),
      sb.from("advertisements").select("type, impression_count, click_count")
    ])

    let totalImpressions = 0
    let totalClicks = 0
    const byType: Record<string, number> = { image: 0, video: 0 }

    if (adsData) {
      adsData.forEach(ad => {
        totalImpressions += ad.impression_count || 0
        totalClicks += ad.click_count || 0
        byType[ad.type] = (byType[ad.type] || 0) + 1
      })
    }

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    return {
      success: true,
      data: {
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        totalImpressions,
        totalClicks,
        ctr: parseFloat(ctr.toFixed(2)),
        byType
      }
    }
  } catch (error: any) {
    console.error("[getAdStats] Error:", error)
    return { success: false, error: error.message || "获取广告统计失败" }
  }
}

export async function createAd(formData: FormData) {
  try {
    const session = await requireAdminSession()
    const sb = getSupabase()

    const title = formData.get("title") as string
    const type = formData.get("type") as "image" | "video"
    const position = formData.get("position") as string
    const linkUrl = formData.get("linkUrl") as string
    const priority = parseInt(formData.get("priority") as string || "0")
    const status = formData.get("status") as "active" | "inactive"
    const file = formData.get("file") as File

    if (!title || !type || !position || !file) {
      return { success: false, error: "缺少必要参数" }
    }

    // 这里应该实现文件上传逻辑
    // 由于文件上传需要存储到Supabase Storage，这里暂时返回模拟的fileUrl
    // 实际实现中应该上传文件到Supabase Storage并获取URL
    const fileUrl = `https://example.com/uploaded/${file.name}`
    const fileSize = file.size

    const now = new Date().toISOString()
    const { data, error } = await sb
      .from("advertisements")
      .insert({
        title,
        type,
        position,
        file_url: fileUrl,
        link_url: linkUrl || null,
        priority,
        status,
        file_size: fileSize,
        impression_count: 0,
        click_count: 0,
        created_at: now,
        updated_at: now,
        created_by: session.adminId
      })
      .select()
      .single()

    if (error) {
      console.error("[createAd] Supabase error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("[createAd] Error:", error)
    return { success: false, error: error.message || "创建广告失败" }
  }
}

export async function updateAd(id: string, updateData: UpdateAdData) {
  try {
    await requireAdminSession()
    const sb = getSupabase()

    const { data, error } = await sb
      .from("advertisements")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[updateAd] Supabase error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("[updateAd] Error:", error)
    return { success: false, error: error.message || "更新广告失败" }
  }
}

export async function deleteAd(id: string) {
  try {
    await requireAdminSession()
    const sb = getSupabase()

    const { error } = await sb
      .from("advertisements")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[deleteAd] Supabase error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[deleteAd] Error:", error)
    return { success: false, error: error.message || "删除广告失败" }
  }
}

export async function toggleAdStatus(id: string) {
  try {
    await requireAdminSession()
    const sb = getSupabase()

    // 先获取当前状态
    const { data: ad, error: fetchError } = await sb
      .from("advertisements")
      .select("status")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("[toggleAdStatus] Fetch error:", fetchError)
      return { success: false, error: fetchError.message }
    }

    const newStatus = ad.status === "active" ? "inactive" : "active"

    const { data, error } = await sb
      .from("advertisements")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[toggleAdStatus] Update error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("[toggleAdStatus] Error:", error)
    return { success: false, error: error.message || "切换广告状态失败" }
  }
}