import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { getCosFileUrl, setCosObjectPublicRead } from "@/lib/tencent/cos-client"
import { submitPdfToImageTask, waitForDocProcess } from "@/lib/tencent/ci-client"
import { extractStructuredInfo } from "@/lib/tencent/hunyuan-client"
import { dbAdapter } from "@/lib/market/db-adapter"

// 常量配置
const MAX_PDF_PAGES = 50 // 最大页数限制
const MAX_AI_USAGE_COUNT = 20 // PDF 分析次数上限
const MAX_VISION_IMAGES = 6 // 混元视觉模型最多处理图片数量

/**
 * 新流程：前端直传 COS 后，调用此接口进行解析
 * 请求体: { cosUrl: string } 或 { cosKey: string }
 */
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

    const body = await request.json()
    const cosUrl = body.cosUrl
    const cosKey = body.cosKey

    if (!cosUrl && !cosKey) {
      return Response.json({ ok: false, message: "缺少 PDF 文件地址 (cosUrl 或 cosKey)" }, { status: 400 })
    }

    // 如果只传了 key，拼装出 URL
    const finalCosUrl = cosUrl || getCosFileUrl(cosKey)
    console.log('[PDF Parse] 开始解析 COS 文件:', finalCosUrl)

    // Step 0: 确保文件是公开读取的（CI 服务需要能访问）
    console.log('[PDF Parse] 确保文件公开读取...')
    const cosKeyForAcl = cosKey || finalCosUrl.replace(`https://${process.env.TENCENT_COS_BUCKET}.cos.${process.env.TENCENT_COS_REGION}.myqcloud.com/`, '')
    const aclOk = await setCosObjectPublicRead(cosKeyForAcl)
    console.log('[PDF Parse] 文件ACL设置:', aclOk ? '成功' : '失败（如果CI报错请检查）')

    // Step 1: 调用数据万象 CI 进行 PDF 分页转图片
    console.log('[PDF Parse] 开始调用数据万象 PDF 转图片...')
    const taskId = await submitPdfToImageTask(finalCosUrl)
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

    // Step 2: 设置图片为公开读取（CI 处理后的图片 URL 可能是临时的，需要确认权限）
    // 如果 CI 处理后的图片已经在 COS 且是公开的，这步可以省略或简化
    // 这里假设 CI 返回的 URL 是可以直接访问的，如果不行再去设置
    // 为了安全起见，我们尝试设置一下公开读取（如果 URL 指向 COS 且有 key 的话）
    console.log('[PDF Parse] 处理前', MAX_VISION_IMAGES, '页图片')

    // Step 3: 调用混元多模态 AI 提取结构化信息
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
      pdfUrl: finalCosUrl,
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
