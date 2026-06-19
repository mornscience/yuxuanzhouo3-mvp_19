import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { uploadToOss } from "@/lib/aliyun/oss-client"
import { analyzeDocument, waitForDocumentResult } from "@/lib/aliyun/docmind-client"
import { extractStructuredInfo } from "@/lib/aliyun/qwen-client"

export async function POST(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ ok: false, message: "Please upload a file" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return Response.json({ ok: false, message: "Only PDF files are supported" }, { status: 400 })
    }

    // Step 1: 读取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Step 2: 上传到阿里云 OSS
    console.log('[PDF Parse] 开始上传文件到 OSS...')
    const ossUrl = await uploadToOss(fileBuffer, file.name)
    console.log('[PDF Parse] 文件已上传到 OSS:', ossUrl)

    // Step 3: 调用文档智能解析 PDF
    console.log('[PDF Parse] 开始调用文档智能解析...')
    const taskId = await analyzeDocument(ossUrl)
    console.log('[PDF Parse] 文档智能任务ID:', taskId)

    // Step 4: 轮询等待解析结果
    console.log('[PDF Parse] 等待文档智能解析结果...')
    const docResult = await waitForDocumentResult(taskId)
    console.log('[PDF Parse] 文档智能解析完成')

    // Step 5: 提取图片 URL（文档智能会生成每页的图片）
    const imageUrls: string[] = []
    if (docResult.Pages && Array.isArray(docResult.Pages)) {
      docResult.Pages.forEach((page: any) => {
        if (page.ImageUrl) {
          imageUrls.push(page.ImageUrl)
        }
      })
    }

    if (imageUrls.length === 0) {
      throw new Error('未能提取到文档图片')
    }
    console.log('[PDF Parse] 提取到图片数量:', imageUrls.length)

    // Step 6: 调用 Qwen3-VL-Plus 多模态大模型提取结构化信息
    console.log('[PDF Parse] 开始调用 Qwen3-VL-Plus 多模态解析...')
    const parsedData = await extractStructuredInfo(imageUrls)
    console.log('[PDF Parse] 多模态解析完成:', JSON.stringify(parsedData))

    return Response.json({
      ok: true,
      data: parsedData
    })

  } catch (error: any) {
    console.error('[PDF Parse] 解析失败:', error)
    return Response.json(
      { ok: false, message: error.message || "PDF parsing failed" },
      { status: 500 }
    )
  }
}