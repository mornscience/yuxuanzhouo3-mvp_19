import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/api-utils"
import { isCN } from "@/lib/db-adapter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VIDEO_DIR = "advertisements/videos"

function ok(message: string, data?: any) {
  return NextResponse.json({ ok: true, message, data })
}
function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

async function uploadToCloudBase(buffer: Buffer, fileName: string, cloudPath: string) {
  const cloudbase = await import("@cloudbase/node-sdk")
  const BUCKET = process.env.CLOUDBASE_BUCKET_ID || ""
  const CDN_BASE = `https://${BUCKET}.tcb.qcloud.la`
  const app = cloudbase.init({
    env: process.env.CLOUDBASE_ENV_ID || "",
    secretId: process.env.CLOUDBASE_SECRET_ID || "",
    secretKey: process.env.CLOUDBASE_SECRET_KEY || "",
  })
  await app.uploadFile({ cloudPath, fileContent: buffer })
  return `${CDN_BASE}/${cloudPath}`
}

async function uploadToSupabase(buffer: Buffer, fileName: string, cloudPath: string) {
  const { createClient } = await import("@supabase/supabase-js")
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await sb.storage.from("videos").upload(cloudPath, buffer, {
    contentType: "video/mp4",
    upsert: false,
  })
  if (error) throw new Error(error.message)
  const { data } = sb.storage.from("videos").getPublicUrl(cloudPath)
  return data.publicUrl
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return fail("用户未登录", 401)

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return fail("请选择要上传的视频文件")

    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-m4v"]
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith(".mp4")) {
      return fail("只支持上传 MP4 格式视频")
    }

    const MAX_SIZE = 200 * 1024 * 1024
    if (file.size > MAX_SIZE) return fail("视频文件不能超过 200MB")

    const ext = file.name.split(".").pop() || "mp4"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const cloudPath = `${VIDEO_DIR}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let videoUrl: string
    if (isCN()) {
      videoUrl = await uploadToCloudBase(buffer, fileName, cloudPath)
    } else {
      videoUrl = await uploadToSupabase(buffer, fileName, cloudPath)
    }

    console.log(`[Upload] 视频上传成功 (${isCN() ? "CloudBase" : "Supabase"}): ${cloudPath}`)
    return ok("视频上传成功", { videoUrl, cloudPath, fileName })
  } catch (error: any) {
    console.error("[Upload] 视频上传失败:", error)
    return fail(error?.message || "视频上传失败，请重试", 500)
  }
}
