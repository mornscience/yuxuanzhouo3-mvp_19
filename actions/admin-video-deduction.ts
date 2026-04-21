"use server"

import { createClient } from "@supabase/supabase-js"
import { requireAdminSession } from "@/lib/admin/session"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface VideoDeduction {
  id: string
  title: string
  video_url: string
  is_active: boolean
  file_size: number
  duration: number
  created_at: string
  updated_at: string
}

export async function listVideos() {
  try {
    await requireAdminSession()
    const sb = getSupabase()

    const { data, error } = await sb
      .from("video_deduction")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[listVideos] Supabase error:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    console.error("[listVideos] Error:", error)
    return { success: false, error: error.message || "获取视频列表失败" }
  }
}

export async function createVideo(formData: FormData) {
  try {
    await requireAdminSession()
    const sb = getSupabase()

    const title = formData.get("title") as string
    const file = formData.get("file") as File

    if (!title || !file) {
      return { success: false, error: "缺少必要参数" }
    }

    // 这里应该实现文件上传逻辑
    // 由于文件上传需要存储到Supabase Storage，这里暂时返回模拟的videoUrl
    // 实际实现中应该上传文件到Supabase Storage并获取URL
    const videoUrl = `https://example.com/uploaded/${file.name}`
    const fileSize = file.size

    const now = new Date().toISOString()
    const { data, error } = await sb
      .from("video_deduction")
      .insert({
        title,
        video_url: videoUrl,
        is_active: false,
        file_size: fileSize,
        duration: 0,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (error) {
      console.error("[createVideo] Supabase error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("[createVideo] Error:", error)
    return { success: false, error: error.message || "创建视频失败" }
  }
}

export async function deleteVideo(id: string) {
  try {
    await requireAdminSession()
    const sb = getSupabase()

    const { error } = await sb
      .from("video_deduction")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[deleteVideo] Supabase error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[deleteVideo] Error:", error)
    return { success: false, error: error.message || "删除视频失败" }
  }
}

export async function activateVideo(id: string) {
  try {
    await requireAdminSession()
    const sb = getSupabase()

    // 先将所有视频设置为非激活
    await sb
      .from("video_deduction")
      .update({ is_active: false, updated_at: new Date().toISOString() })

    // 然后将指定视频设置为激活
    const { data, error } = await sb
      .from("video_deduction")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[activateVideo] Supabase error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("[activateVideo] Error:", error)
    return { success: false, error: error.message || "激活视频失败" }
  }
}

export async function getActiveVideo() {
  try {
    const sb = getSupabase()

    const { data, error } = await sb
      .from("video_deduction")
      .select("*")
      .eq("is_active", true)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // 没有激活的视频
        return { success: true, data: null }
      }
      console.error("[getActiveVideo] Supabase error:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error("[getActiveVideo] Error:", error)
    return { success: false, error: error.message || "获取激活视频失败" }
  }
}