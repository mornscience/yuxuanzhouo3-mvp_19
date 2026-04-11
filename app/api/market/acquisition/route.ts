import { NextRequest } from "next/server"
import {
  getUserIdFromRequest,
  readRouteJson,
  successJson,
  errorJson,
} from "@/lib/market/marketing-route"
import {
  loadCooperations,
  createCooperation,
  getBloggerById,
} from "@/lib/market/acquisition"
import { sendEmail } from "@/lib/market/send-email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  
  if (!userId) {
    return errorJson("Login required", "请先登录后再进行操作", 401)
  }

  try {
    const cooperations = await loadCooperations(userId)
    return successJson({ data: cooperations })
  } catch (error) {
    return errorJson(error, "Failed to load cooperations")
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)

  if (!userId) {
    return errorJson("Login required", "请先登录后再进行操作", 401)
  }

  try {
    const body = await readRouteJson(request)
    const action = String(body.action || "")

    if (action === "apply_cooperation") {
      const bloggerId = String(body.bloggerId || "")
      const message = String(body.message || "")
      
      if (!bloggerId) {
        return errorJson("Missing bloggerId", "博主ID不能为空", 400)
      }

      // 获取博主信息
      const blogger = await getBloggerById(bloggerId)
      if (!blogger) {
        return errorJson("Blogger not found", "博主信息不存在", 404)
      }

      // 创建合作记录
      const result = await createCooperation(userId, {
        bloggerId,
        bloggerName: blogger.name,
        platform: blogger.platform,
        email: blogger.email,
        articleTemplateId: "", // 暂时为空
        publishType: "now",
        channels: "",
      })
      
      return successJson({ result, message: "合作申请已提交" })
    }

    if (action === "send_email") {
      const bloggerId = String(body.bloggerId || "")
      const content = String(body.content || "")
      
      if (!bloggerId || !content) {
        return errorJson("Missing required fields", "博主ID和邮件内容不能为空", 400)
      }

      // 获取博主信息
      const blogger = await getBloggerById(bloggerId)
      if (!blogger || !blogger.email) {
        return errorJson("Blogger email not found", "博主邮箱信息不存在", 404)
      }

      // 发送邮件
      const to = blogger.email
      const subject = "合作邀请"
      
      const result = await sendEmail({ to, subject, body: content })
      if (!result.success) {
        return errorJson(result.message, result.message, 500)
      }
      
      return successJson({ result, message: "邮件发送成功" })
    }

    return errorJson("Unknown action", "Unknown action", 400)
  } catch (error) {
    return errorJson(error, "Failed to process acquisition action")
  }
}
