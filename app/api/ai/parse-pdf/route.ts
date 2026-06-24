import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { uploadToCos } from "@/lib/tencent/cos-client"
import { submitPdfToImageTask, waitForDocProcess } from "@/lib/tencent/ci-client"
import { extractStructuredInfo } from "@/lib/tencent/hunyuan-client"
import { dbAdapter } from "@/lib/market/db-adapter"

// 常量配置
const MAX_FILE_SIZE = 60 * 1024 * 1024 // 60MB (支持最多50页PDF)
const MAX_PDF_PAGES = 50 // 最大页数限制
const MAX_AI_USAGE_COUNT = 20 // PDF 分析次数上限

export async function POST(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    
    // 检查用户企业认证状态和 AI 使用次数
    const profileRows = await dbAdapter.loadRows("user_market_profiles", { id: userId })
    if (profileRows.length === 0) {
      return Response.json({ ok: false, message: "用户资料不存在" }, { status: 404 })
    }
    
    const profile = profileRows[0]
    const isMerchantVerified = !!(profile?.isMerchantVerified ?? profile?.is_merchant_verified)
    const aiUsageCount = Number(profile?.aiUsageCount ?? profile?.ai_usage_count ?? 0)
    
    // 检查企业认证状态
    if (!isMerchantVerified) {
      return Response.json({ ok: false, message: "请先完成企业认证" }, { status: 403 })
    }
    
    // 检查使用次数
    if (aiUsageCount >= MAX_AI_USAGE_COUNT) {
      return Response.json({ ok: false, message: `AI解析次数已达上限（${MAX_AI_USAGE_COUNT}次）` }, { status: 403 })
    }
    
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ ok: false, message: "请上传文件" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return Response.json({ ok: false, message: "仅支持 PDF 格式文件" }, { status: 400 })
    }

    // 后端二次校验文件大小
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ ok: false, message: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 })
    }

    // Step 1: 读取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    console.log('[PDF Parse] 文件大小:', fileBuffer.length)

    // Step 2: 上传到腾讯云 COS
    console.log('[PDF Parse] 开始上传文件到 COS...')
    const cosUrl = await uploadToCos(fileBuffer, file.name)
    console.log('[PDF Parse] 文件已上传到 COS:', cosUrl)

    // Step 3: 调用数据万象 CI 进行 PDF 分页转图片
    console.log('[PDF Parse] 开始调用数据万象 PDF 转图片...')
    const taskId = await submitPdfToImageTask(cosUrl)
    console.log('[PDF Parse] CI任务ID:', taskId)
    
    console.log('[PDF Parse] 等待 PDF 转图片完成...')
    const imageUrls = await waitForDocProcess(taskId)
    
    if (imageUrls.length === 0) {
      return Response.json({ ok: false, message: "未能从 PDF 中提取图片" }, { status: 400 })
    }
    
    // 检查PDF页数
    if (imageUrls.length > MAX_PDF_PAGES) {
      return Response.json({ ok: false, message: `PDF页数不能超过 ${MAX_PDF_PAGES} 页，当前PDF共 ${imageUrls.length} 页` }, { status: 400 })
    }
    
    console.log('[PDF Parse] PDF 转图片完成，共', imageUrls.length, '页')

    // Step 4: 调用混元多模态 AI 提取结构化信息
    console.log('[PDF Parse] 开始调用混元多模态解析...')
    const parsedData = await extractStructuredInfo(imageUrls)
    console.log('[PDF Parse] 多模态解析完成:', JSON.stringify(parsedData))

    // 使用次数递增
    await dbAdapter.updateRow("user_market_profiles", { id: userId }, {
      aiUsageCount: aiUsageCount + 1,
      ai_usage_count: aiUsageCount + 1 // 兼容两种命名格式
    })

    return Response.json({
      ok: true,
      data: parsedData,
      pdfUrl: cosUrl,
      imageUrls: imageUrls,
      aiUsageCount: aiUsageCount + 1,
      aiUsageLimit: MAX_AI_USAGE_COUNT
    })

  } catch (error: any) {
    console.error('[PDF Parse] 解析失败:', error)
    return Response.json(
      { ok: false, message: error.message || "PDF 解析失败" },
      { status: 500 }
    )
  }
}