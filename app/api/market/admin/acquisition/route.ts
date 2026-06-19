import { NextRequest } from "next/server"
import {
  verifyMarketingAdmin,
  getUserIdFromRequest,
  readRouteJson,
  successJson,
  errorJson,
} from "@/lib/market/marketing-route"
import {
  loadAcquisitionBootstrap,
  insertBlogger,
  insertB2BLead,
  updateB2BLeadStatus,
  insertVCLead,
  updateVCLeadStatus,
  insertAd,
  updateBloggerStatus,
  updateAd,
  participateInAd,
  completeAdTask,
  updateProfileVerification,
  upsertBloggerProfile,
  deleteBlogger,
  deleteBloggerSoft,
  deleteB2BLead,
  deleteVCLead,
  deleteAd,
  submitUnifiedForm,
  loadUserTransactions,
  requestWithdrawal,
  publishB2BLead,
  publishVCLead,
  createCollectTask,
  updateTaskStatus,
  loadCollectTempData,
  syncTempToBloggers,
} from "@/lib/market/acquisition"
import { sendEmail } from "@/lib/market/send-email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const admin = verifyMarketingAdmin(request)
  const userId = getUserIdFromRequest(request)

  if (!admin) return errorJson("Unauthorized", "Unauthorized", 401)

  try {
    const data = await loadAcquisitionBootstrap(userId)
    return successJson({ data })
  } catch (error) {
    return errorJson(error, "Failed to load acquisition data")
  }
}

export async function POST(request: NextRequest) {
  const admin = verifyMarketingAdmin(request)
  if (!admin) return errorJson("Unauthorized", "Unauthorized", 401)

  const userId = getUserIdFromRequest(request)

  try {
    const body = await readRouteJson(request)
    const action = String(body.action || "")

    // 所有 POST 操作都需要登录
    if (!userId) {
      return errorJson("Login required", "请先登录后再进行操作", 401)
    }

    if (action === "insert_blogger") {
      const result = await insertBlogger(userId, {
        name: String(body.name || ""),
        platform: String(body.platform || ""),
        followers: String(body.followers || ""),
        email: String(body.email || ""),
        cost: String(body.cost || ""),
        commission: String(body.commission || ""),
      })
      return successJson({ result })
    }

    if (action === "update_influencer_profile") {
      const result = await upsertBloggerProfile(userId, {
        name: String(body.name || ""),
        platform: String(body.platform || ""),
        followers: String(body.followers || ""),
        email: String(body.email || ""),
        cost: String(body.cost || ""),
        commission: String(body.commission || ""),
      })
      return successJson({ result })
    }

    if (action === "insert_b2b_lead") {
      const result = await insertB2BLead(userId, {
        name: String(body.name || ""),
        region: String(body.region || ""),
        contact: String(body.contact || ""),
        email: String(body.email || ""),
        estValue: String(body.estValue || ""),
        type: (body.type as "follow" | "publish") || "follow",
        description: body.description ? String(body.description) : undefined,
      })
      
      return successJson({ result })
    }

    if (action === "update_b2b_status") {
      const result = await updateB2BLeadStatus(
        userId,
        String(body.id || ""),
        String(body.status || ""),
      )
      return successJson({ result })
    }

    if (action === "insert_vc_lead") {
      const result = await insertVCLead(userId, {
        name: String(body.name || ""),
        region: String(body.region || ""),
        contact: String(body.contact || ""),
        email: String(body.email || ""),
        focus: String(body.focus || ""),
        type: (body.type as "follow" | "publish") || "follow",
        fundingAmount: body.fundingAmount ? String(body.fundingAmount) : undefined,
        fundingStage: body.fundingStage ? String(body.fundingStage) : undefined,
        description: body.description ? String(body.description) : undefined,
      })
      return successJson({ result })
    }

    if (action === "update_vc_status") {
      const result = await updateVCLeadStatus(
        userId,
        String(body.id || ""),
        String(body.status || ""),
      )
      return successJson({ result })
    }

    if (action === "insert_ad") {
      const result = await insertAd(userId, {
        brand: String(body.brand || ""),
        type: String(body.type || ""),
        duration: String(body.duration || ""),
        reward: String(body.reward || ""),
        videoUrl: body.videoUrl ? String(body.videoUrl) : undefined,
      })
      return successJson({ result })
    }

    if (action === "update_blogger_status") {
      const result = await updateBloggerStatus(
        userId,
        String(body.id || ""),
        String(body.status || ""),
      )
      return successJson({ result })
    }

    if (action === "update_ad") {
      const result = await updateAd(userId, String(body.id || ""), {
        duration: body.duration !== undefined ? String(body.duration) : undefined,
        reward: body.reward !== undefined ? String(body.reward) : undefined,
        status: body.status !== undefined ? String(body.status) : undefined,
      })
      return successJson({ result })
    }

    if (action === "delete_blogger") {
      const result = await deleteBlogger(userId, String(body.id || ""))
      return successJson({ result })
    }

    if (action === "delete_blogger_soft") {
      const result = await deleteBloggerSoft(userId, String(body.id || ""))
      return successJson({ result })
    }

    if (action === "delete_b2b_lead") {
      const result = await deleteB2BLead(userId, String(body.id || ""))
      return successJson({ result })
    }

    if (action === "delete_vc_lead") {
      const result = await deleteVCLead(userId, String(body.id || ""))
      return successJson({ result })
    }

    if (action === "delete_ad") {
      const result = await deleteAd(userId, String(body.id || ""))
      return successJson({ result })
    }

    if (action === "participate_ad") {
      const result = await participateInAd(userId, String(body.adId || ""), String(body.reward || "0"))
      return successJson({ result })
    }

    if (action === "complete_ad_task") {
      const result = await completeAdTask(userId, String(body.participationId || ""))
      return successJson({ result })
    }

    if (action === "update_verification") {
      const result = await updateProfileVerification(userId, body.type as any, {
        fullName: body.fullName,
        idNumber: body.idNumber,
      })
      return successJson({ result })
    }

    if (action === "submit_form") {
      const result = await submitUnifiedForm(userId, body.data)
      return successJson({ result })
    }

    if (action === "load_transactions") {
      const result = await loadUserTransactions(userId)
      return successJson({ result })
    }

    if (action === "request_withdrawal") {
      const result = await requestWithdrawal(userId, String(body.amount || "0"))
      if (!result.success) {
        return errorJson(result.message, result.message, 400)
      }
      return successJson({ result })
    }

    if (action === "send_email") {
      const to = String(body.to || "")
      const subject = String(body.subject || "")
      const emailBody = String(body.body || "")
      if (!to || !subject) {
        return errorJson("Missing required fields", "收件邮箱和主题不能为空", 400)
      }
      const result = await sendEmail({ to, subject, body: emailBody })
      if (!result.success) {
        return errorJson(result.message, result.message, 500)
      }
      return successJson({ result })
    }

    if (action === "publish_b2b_lead") {
      const result = await publishB2BLead(
        userId,
        String(body.leadId || ""),
        Boolean(body.isPublic)
      )
      return successJson({ result })
    }

    if (action === "publish_vc_lead") {
      const result = await publishVCLead(
        userId,
        String(body.leadId || ""),
        Boolean(body.isPublic)
      )
      return successJson({ result })
    }

    if (action === "create_collect_task") {
      const result = await createCollectTask(userId, {
        taskName: String(body.taskName || ""),
        platform: String(body.platform || "抖音"),
        keyword: String(body.keyword || ""),
        maxLimit: Number(body.maxLimit || 1000),
      })
      return successJson({ result })
    }

    if (action === "update_collect_task_status") {
      const result = await updateTaskStatus(userId, String(body.taskId || ""), String(body.status || ""))
      return successJson({ result })
    }

    if (action === "load_collect_temp") {
      const rows = await loadCollectTempData(userId, String(body.taskId || ""))
      return successJson({ data: rows })
    }

    if (action === "sync_temp_to_bloggers") {
      const result = await syncTempToBloggers(userId, String(body.taskId || ""))
      return successJson({ result })
    }

    return errorJson("Unknown action", "Unknown action", 400)
  } catch (error) {
    return errorJson(error, "Failed to process acquisition action")
  }
}
