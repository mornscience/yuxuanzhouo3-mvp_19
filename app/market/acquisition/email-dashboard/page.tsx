"use client"

import { useState, useEffect } from "react"
import { Mail, TrendingUp, Eye, MessageSquare, Send, Calendar, ArrowRight, RefreshCw, Loader2, MailCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EmailStats {
  overview: {
    totalSent: number
    totalOpened: number
    totalReplied: number
    openRate: string
    replyRate: string
    avgClickCount: string
  }
  last7Days: {
    date: string
    sent: number
    opened: number
    replied: number
  }[]
  recentSends: {
    id: string
    customerEmail: string
    subject: string
    status: string
    sendTime: string
    openTime: string
    replyTime: string
    replyFrom?: string
    replyBody?: string
    clickCount: number
  }[]
}

export default function EmailDashboardPage() {
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingReplies, setCheckingReplies] = useState(false)
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/market/email/stats", { credentials: "include" })
      const result = await response.json()
      if (result.ok) {
        setStats(result.data)
      }
    } catch (error) {
      console.error("获取邮件统计数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const checkReplies = async () => {
    setCheckingReplies(true)
    try {
      const response = await fetch("/api/market/email/track/reply?action=check", {
        credentials: "include"
      })
      const result = await response.json()
      
      if (result.ok) {
        alert(result.message)
        // 刷新统计数据
        await fetchStats()
      } else {
        alert("检查失败: " + result.message)
      }
    } catch (error) {
      console.error("检查回复失败:", error)
      alert("检查回复失败")
    } finally {
      setCheckingReplies(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      sent: "bg-blue-100 text-blue-800",
      opened: "bg-green-100 text-green-800",
      replied: "bg-purple-100 text-purple-800"
    }
    const labels: Record<string, string> = {
      sent: "已发送",
      opened: "已打开",
      replied: "已回复"
    }
    return (
      <Badge className={styles[status] || styles.sent}>
        {labels[status] || status}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const maxValue = stats?.last7Days ? Math.max(...stats.last7Days.map(d => Math.max(d.sent, d.opened, d.replied))) : 10

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              Email Analytics Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={checkReplies}
                disabled={checkingReplies}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                <MailCheck className={checkingReplies ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />
                {checkingReplies ? "检查中..." : "检查回复"}
              </button>
              <button
                onClick={fetchStats}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Sent</p>
                  <p className="text-2xl font-bold mt-1">{stats?.overview.totalSent || 0}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Open Rate</p>
                  <p className="text-2xl font-bold mt-1">{stats?.overview.openRate || "0.0"}%</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Reply Rate</p>
                  <p className="text-2xl font-bold mt-1">{stats?.overview.replyRate || "0.0"}%</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Avg Clicks</p>
                  <p className="text-2xl font-bold mt-1">{stats?.overview.avgClickCount || "0.0"}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Email Activity Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="h-64 flex items-end justify-between gap-2 px-4">
                {stats?.last7Days.map((day, index) => {
                  const date = new Date(day.date)
                  const dayName = date.toLocaleDateString("zh-CN", { weekday: "short" })
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex gap-1 items-end h-48">
                        <div
                          className="flex-1 bg-blue-500 rounded-t"
                          style={{ height: `${(day.sent / maxValue) * 100}%`, minHeight: day.sent > 0 ? "8px" : "2px" }}
                          title={`Sent: ${day.sent}`}
                        />
                        <div
                          className="flex-1 bg-green-500 rounded-t"
                          style={{ height: `${(day.opened / maxValue) * 100}%`, minHeight: day.opened > 0 ? "8px" : "2px" }}
                          title={`Opened: ${day.opened}`}
                        />
                        <div
                          className="flex-1 bg-purple-500 rounded-t"
                          style={{ height: `${(day.replied / maxValue) * 100}%`, minHeight: day.replied > 0 ? "8px" : "2px" }}
                          title={`Replied: ${day.replied}`}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{dayName}</span>
                      <span className="text-xs text-slate-400">{date.getDate()}</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-sm text-slate-600">Sent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-slate-600">Opened</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span className="text-sm text-slate-600">Replied</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Recent Emails</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : stats?.recentSends.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Mail className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No email records yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.recentSends.map((send) => (
                  <div
                    key={send.id}
                    className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{send.subject}</span>
                          {getStatusBadge(send.status)}
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{send.customerEmail}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            {formatDate(send.sendTime)}
                          </span>
                          {send.openTime && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatDate(send.openTime)}
                            </span>
                          )}
                          {send.replyTime && (
                            <button 
                              onClick={() => setExpandedEmail(expandedEmail === send.id ? null : send.id)}
                              className="flex items-center gap-1 hover:text-purple-600"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {formatDate(send.replyTime)}
                            </button>
                          )}
                          {send.clickCount > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {send.clickCount} clicks
                            </span>
                          )}
                        </div>
                        {/* 回复内容展开区域 */}
                        {expandedEmail === send.id && send.replyBody && (
                          <div className="mt-2 p-3 bg-purple-50 rounded-lg text-sm">
                            <div className="text-purple-600 font-medium mb-1">
                              回复自: {send.replyFrom}
                            </div>
                            <div className="text-gray-700 whitespace-pre-wrap">
                              {send.replyBody}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
