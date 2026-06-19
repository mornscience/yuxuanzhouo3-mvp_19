import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
} from "@/lib/market/notification-service"

// GET /api/notifications - 获取用户通知列表
export async function GET(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "count") {
      const count = await getUnreadNotificationCount(userId)
      return Response.json({ ok: true, data: { count } })
    }

    const result = await getUserNotifications(userId)
    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 })
    }
    return Response.json({ ok: true, data: result.data })
  } catch (error: any) {
    console.error("获取通知失败:", error)
    return Response.json(
      { ok: false, message: error.message || "获取通知失败" },
      { status: 500 }
    )
  }
}

// POST /api/notifications - 标记通知为已读
export async function POST(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()
    const { action, notificationId } = body

    if (action === "markAllRead") {
      const result = await markAllNotificationsAsRead(userId)
      return Response.json(result)
    }

    if (notificationId) {
      const result = await markNotificationAsRead(notificationId)
      return Response.json(result)
    }

    return Response.json({ ok: false, message: "缺少参数" }, { status: 400 })
  } catch (error: any) {
    console.error("操作通知失败:", error)
    return Response.json(
      { ok: false, message: error.message || "操作通知失败" },
      { status: 500 }
    )
  }
}
