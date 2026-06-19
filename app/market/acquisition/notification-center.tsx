"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, CheckCheck, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UserNotification } from "@/lib/market/acquisition-types"

interface NotificationCenterProps {
  isLoggedIn: boolean
}

export function NotificationCenter({ isLoggedIn }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 加载通知列表
  const loadNotifications = async () => {
    if (!isLoggedIn) return
    try {
      setLoading(true)
      const response = await fetch("/api/notifications", { credentials: "include" })
      const result = await response.json()
      if (result.ok && result.data) {
        setNotifications(result.data)
        setUnreadCount(result.data.filter((n: UserNotification) => !n.read).length)
      }
    } catch (error) {
      console.error("加载通知失败:", error)
    } finally {
      setLoading(false)
    }
  }

  // 加载未读数量
  const loadUnreadCount = async () => {
    if (!isLoggedIn) return
    try {
      const response = await fetch("/api/notifications?action=count", { credentials: "include" })
      const result = await response.json()
      if (result.ok && result.data) {
        setUnreadCount(result.data.count)
      }
    } catch (error) {
      console.error("加载未读数量失败:", error)
    }
  }

  // 标记单个已读
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notificationId })
      })
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("标记已读失败:", error)
    }
  }

  // 标记全部已读
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "markAllRead" })
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("标记全部已读失败:", error)
    }
  }

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 初始加载和定时刷新
  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000) // 每30秒刷新一次
    return () => clearInterval(interval)
  }, [isLoggedIn])

  // 打开下拉框时加载通知列表
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const getNotificationIcon = (type: string) => {
    if (type.includes("approved")) {
      return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><Check className="w-4 h-4 text-green-600" /></div>
    }
    if (type.includes("rejected")) {
      return <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><X className="w-4 h-4 text-red-600" /></div>
    }
    return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><Bell className="w-4 h-4 text-blue-600" /></div>
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 30) return `${days}d ago`
    return date.toLocaleDateString("en-US")
  }

  if (!isLoggedIn) {
    return (
      <Button variant="outline" size="icon" className="rounded-full w-8 h-8 relative flex-shrink-0 opacity-50 cursor-not-allowed">
        <Bell size={15} />
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-8 h-8 relative flex-shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all as read
              </button>
            )}
          </div>

          {/* 通知列表 */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-blue-50/30" : ""
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notification.read ? "text-slate-900" : "text-slate-600"}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatTime(notification.createdAt)}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
