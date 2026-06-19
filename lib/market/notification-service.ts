import { dbAdapter } from "./db-adapter"
import { randomUUID } from "crypto"
import type { UserNotification } from "./acquisition-types"

const NOTIFICATIONS_TABLE = "user_notifications"

// 创建通知
export async function createNotification(data: {
  userId: string
  type: UserNotification["type"]
  title: string
  message: string
}): Promise<{ ok: boolean; message: string }> {
  try {
    await dbAdapter.insertRow(NOTIFICATIONS_TABLE, {
      id: randomUUID(),
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      read: false,
      createdAt: new Date().toISOString()
    })
    return { ok: true, message: "通知创建成功" }
  } catch (error: any) {
    console.error("[Notification] 创建失败:", error.message)
    return { ok: false, message: "创建通知失败" }
  }
}

// 将 snake_case 转换为 camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
}

// 转换对象的所有键为 camelCase
function convertToCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value
  }
  return result
}

// 获取用户通知列表
export async function getUserNotifications(userId: string): Promise<{ ok: boolean; data?: UserNotification[]; message?: string }> {
  try {
    const notifications = await dbAdapter.loadRows(NOTIFICATIONS_TABLE, { userId })
    // 转换字段名为 camelCase
    const converted = notifications.map((n: any) => convertToCamelCase(n))
    // 按时间倒序排列
    const sorted = converted.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return { ok: true, data: sorted as UserNotification[] }
  } catch (error) {
    console.error("获取通知失败:", error)
    return { ok: false, message: "获取通知失败" }
  }
}

// 标记通知为已读
export async function markNotificationAsRead(notificationId: string): Promise<{ ok: boolean; message: string }> {
  try {
    await dbAdapter.updateRow(NOTIFICATIONS_TABLE, { id: notificationId }, { read: true })
    return { ok: true, message: "标记已读成功" }
  } catch (error) {
    console.error("标记已读失败:", error)
    return { ok: false, message: "标记已读失败" }
  }
}

// 标记所有通知为已读
export async function markAllNotificationsAsRead(userId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const notifications = await dbAdapter.loadRows(NOTIFICATIONS_TABLE, { userId, read: false })
    for (const notification of notifications) {
      await dbAdapter.updateRow(NOTIFICATIONS_TABLE, { id: notification.id }, { read: true })
    }
    return { ok: true, message: "全部标记已读成功" }
  } catch (error) {
    console.error("标记全部已读失败:", error)
    return { ok: false, message: "标记全部已读失败" }
  }
}

// 获取未读通知数量
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const notifications = await dbAdapter.loadRows(NOTIFICATIONS_TABLE, { userId, read: false })
    return notifications.length
  } catch (error) {
    console.error("获取未读通知数量失败:", error)
    return 0
  }
}
