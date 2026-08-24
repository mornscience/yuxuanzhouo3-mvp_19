import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { getCosPresignedUploadUrl } from "@/lib/tencent/cos-client"

/**
 * 前端直传 COS 的第一步：获取预签名 PUT URL
 * 请求体: { filename: string }
 * 返回: { uploadUrl: string, key: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = requireAuth(request)

    const body = await request.json()
    const filename = body.filename || "document.pdf"
    
    // 生成一个唯一的 key：时间戳 + 随机 ID + 原始文件名
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 10)
    const key = `pdf/${timestamp}-${randomId}-${filename}`

    console.log('[COS] 生成预签名上传URL, Key:', key)

    const { url, key: finalKey } = await getCosPresignedUploadUrl(key, 1800) // 30分钟有效期

    return Response.json({
      ok: true,
      uploadUrl: url,
      key: finalKey
    })

  } catch (error: any) {
    console.error('[COS] 获取上传URL失败:', error)
    return Response.json(
      { ok: false, message: error.message || "获取上传地址失败" },
      { status: 500 }
    )
  }
}
