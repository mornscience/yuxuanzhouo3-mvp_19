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

    let query = sb.from("acquisition_ads").select("*", { count: "exact" })

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
      query = query.ilike("brand", `%${filters.search}%`)
    }

    query = query.order("created_at", { ascending: false })

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

    // 转换字段名以匹配前端类型定义
    const items = (data || []).map((ad: any) => ({
      id: ad.id,
      title: ad.brand, // 使用 brand 作为 title
      type: ad.type,
      position: ad.position || "top", // 默认为 top
      fileUrl: ad.video_url || "", // 使用 video_url 作为 fileUrl
      linkUrl: ad.link_url || "",
      priority: ad.priority || 0,
      status: ad.status,
      startDate: ad.start_date,
      endDate: ad.end_date,
      fileSize: ad.file_size || 0,
      impression_count: ad.views || 0, // 使用 views 作为 impression_count
      click_count: ad.clicks || 0,
      created_at: ad.created_at,
      updated_at: ad.updated_at
    }))

    return {
      success: true,
      data: {
        items,
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
      sb.from("acquisition_ads").select("*", { count: "exact", head: true }),
      sb.from("acquisition_ads").select("*", { count: "exact", head: true }).eq("status", "投放中"),
      sb.from("acquisition_ads").select("*", { count: "exact", head: true }).eq("status", "待审核"),
      sb.from("acquisition_ads").select("type, views, clicks")
    ])

    let totalImpressions = 0
    let totalClicks = 0
    const byType: Record<string, number> = { image: 0, video: 0 }

    if (adsData) {
      adsData.forEach((ad: any) => {
        totalImpressions += ad.views || 0
        totalClicks += ad.clicks || 0
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
      .from("acquisition_ads")
      .insert({
        brand: title, // 使用 brand 字段
        type,
        duration: "30", // 默认时长
        reward: "10", // 默认奖励
        status: "待审核", // 默认状态
        views: 0,
        video_url: fileUrl,
        link_url: linkUrl || null,
        position,
        priority,
        file_size: fileSize,
        created_at: now,
        updated_at: now,
        user_id: "admin"
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

    // 转换字段名以匹配数据库表结构
    const dbUpdateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updateData.title !== undefined) dbUpdateData.brand = updateData.title
    if (updateData.type !== undefined) dbUpdateData.type = updateData.type
    if (updateData.position !== undefined) dbUpdateData.position = updateData.position
    if (updateData.fileUrl !== undefined) dbUpdateData.video_url = updateData.fileUrl
    if (updateData.linkUrl !== undefined) dbUpdateData.link_url = updateData.linkUrl
    if (updateData.priority !== undefined) dbUpdateData.priority = updateData.priority
    if (updateData.status !== undefined) dbUpdateData.status = updateData.status
    if (updateData.startDate !== undefined) dbUpdateData.start_date = updateData.startDate
    if (updateData.endDate !== undefined) dbUpdateData.end_date = updateData.endDate
    if (updateData.fileSize !== undefined) dbUpdateData.file_size = updateData.fileSize

    const { data, error } = await sb
      .from("acquisition_ads")
      .update(dbUpdateData)
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
      .from("acquisition_ads")
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
      .from("acquisition_ads")
      .select("status")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("[toggleAdStatus] Fetch error:", fetchError)
      return { success: false, error: fetchError.message }
    }

    const newStatus = ad.status === "投放中" ? "待审核" : "投放中"

    const { data, error } = await sb
      .from("acquisition_ads")
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