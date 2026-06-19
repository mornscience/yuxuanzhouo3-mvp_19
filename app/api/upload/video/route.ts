import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/api-utils"
import { isCN } from "@/lib/db-adapter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

async function uploadToSupabase(buffer: Buffer, fileName: string, cloudPath: string, bucket: string) {
  const { createClient } = await import("@supabase/supabase-js")
  
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  
  // 确定文件类型
  let contentType = "application/octet-stream"
  const ext = fileName.toLowerCase().split(".").pop()
  if (ext === "apk") contentType = "application/vnd.android.package-archive"
  else if (ext === "ipa") contentType = "application/octet-stream"
  else if (ext === "hap") contentType = "application/vnd.huawei.app"
  else if (ext === "zip") contentType = "application/zip"
  else if (ext === "mp4") contentType = "video/mp4"
  else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg"
  else if (ext === "png") contentType = "image/png"
  else if (ext === "gif") contentType = "image/gif"
  else if (ext === "pdf") contentType = "application/pdf"

  const { error } = await sb.storage.from(bucket).upload(cloudPath, buffer, {
    contentType,
    upsert: false,
  })
  if (error) throw new Error(error.message)
  const { data } = sb.storage.from(bucket).getPublicUrl(cloudPath)
  return data.publicUrl
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return fail("用户未登录", 401)

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return fail("请选择要上传的文件")

    // 获取存储桶和路径参数
    const bucket = formData.get("bucket") as string || "VIDEOS"
    const customPath = formData.get("path") as string || ""

    // 检查文件类型
    const allowedExtensions = ["mp4", "apk", "ipa", "hap", "zip", "jpg", "jpeg", "png", "gif", "pdf"]
    const ext = file.name.toLowerCase().split(".").pop()
    if (!ext || !allowedExtensions.includes(ext)) {
      return fail("只支持上传 MP4、APK、IPA、HAP、ZIP、JPG、PNG、GIF、PDF 格式文件")
    }

    const MAX_SIZE = 200 * 1024 * 1024
    if (file.size > MAX_SIZE) return fail("文件不能超过 200MB")

    // 生成安全的文件名：完全避免特殊字符问题
    const originalFileName = file.name
    let cloudPath: string
    const safeFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    
    if (customPath) {
      // 提取自定义路径的目录部分（如果有），然后使用安全的文件名
      const pathParts = customPath.split('/')
      if (pathParts.length > 1) {
        // 有目录结构，保留目录但文件名用安全版本
        const dirPart = pathParts.slice(0, -1)
          .map(part => part.replace(/[^\w\-]/g, '_'))
          .join('/')
        cloudPath = `${dirPart}/${safeFileName}`
      } else {
        // 只有文件名，直接使用安全文件名
        cloudPath = safeFileName
      }
    } else {
      // 没有自定义路径，直接使用安全文件名
      cloudPath = safeFileName
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let fileUrl: string
    if (isCN()) {
      fileUrl = await uploadToCloudBase(buffer, originalFileName, cloudPath)
    } else {
      fileUrl = await uploadToSupabase(buffer, originalFileName, cloudPath, bucket)
    }

    console.log(`[Upload] 文件上传成功 (${isCN() ? "CloudBase" : "Supabase"}): ${cloudPath}`)
    return ok("文件上传成功", { videoUrl: fileUrl, cloudPath, fileName: originalFileName })
  } catch (error: any) {
    console.error("[Upload] 文件上传失败:", error)
    return fail(error?.message || "文件上传失败，请重试", 500)
  }
}
