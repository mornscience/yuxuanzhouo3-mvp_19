"use client"

import { useState, useEffect } from "react"
import { MailCheck, Check, X, Eye, Search, ChevronRight, ChevronLeft, Filter, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EmailDraft {
  id: string
  user_id: string
  customer_name: string
  customer_email: string
  subject: string
  body: string
  status: string
  ai_generated: boolean
  created_at: string
  reviewed_at?: string
  review_note?: string
}

interface ReviewStats {
  pending: number
  approved: number
  rejected: number
}

export default function EmailReviewPage() {
  const [drafts, setDrafts] = useState<EmailDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDraft, setSelectedDraft] = useState<EmailDraft | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [stats, setStats] = useState<ReviewStats>({ pending: 0, approved: 0, rejected: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchDrafts = async (page = 1, status = "all", keyword = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        status,
        keyword
      })
      const response = await fetch(`/api/admin/email-review?${params}`, {
        credentials: "include"
      })
      const result = await response.json()
      if (result.ok) {
        setDrafts(result.data)
        setStats(result.stats)
        setTotalPages(result.totalPages)
      }
    } catch (error) {
      console.error("获取邮件草稿失败:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrafts(currentPage, statusFilter, searchKeyword)
  }, [currentPage, statusFilter, searchKeyword])

  const handleReview = async (draftId: string, action: "approve" | "reject", note?: string) => {
    try {
      const response = await fetch("/api/admin/email-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ draftId, action, note })
      })
      const result = await response.json()
      if (result.ok) {
        fetchDrafts(currentPage, statusFilter, searchKeyword)
        if (selectedDraft?.id === draftId) {
          setShowDetail(false)
          setSelectedDraft(null)
        }
      } else {
        alert(result.message || "操作失败")
      }
    } catch (error) {
      console.error("审核操作失败:", error)
      alert("操作失败")
    }
  }

  const handleDelete = async (draftId: string) => {
    if (!confirm("确定要删除这条邮件记录吗？")) return
    
    try {
      const response = await fetch(`/api/admin/email-review/${draftId}`, {
        method: "DELETE",
        credentials: "include"
      })
      const result = await response.json()
      if (result.ok) {
        fetchDrafts(currentPage, statusFilter, searchKeyword)
        if (selectedDraft?.id === draftId) {
          setShowDetail(false)
          setSelectedDraft(null)
        }
      } else {
        alert(result.message || "删除失败")
      }
    } catch (error) {
      console.error("删除操作失败:", error)
      alert("删除失败")
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      draft: "bg-blue-100 text-blue-800",
      sent: "bg-purple-100 text-purple-800"
    }
    const labels: Record<string, string> = {
      pending: "待审核",
      approved: "已通过",
      rejected: "已拒绝",
      draft: "草稿",
      sent: "已发送"
    }
    return (
      <Badge className={styles[status] || styles.draft}>
        {labels[status] || status}
      </Badge>
    )
  }

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MailCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">邮件审核</h1>
            <p className="text-sm text-slate-500">审核用户提交的邮件发送申请</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">待审核</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <MailCheck className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">已通过</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">已拒绝</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索客户名称或邮箱..."
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 邮件列表 */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">邮件列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              暂无邮件记录
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium truncate">{draft.customer_name}</span>
                        {getStatusBadge(draft.status)}
                        {draft.ai_generated && (
                          <Badge variant="outline" className="text-xs">AI生成</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">{draft.subject}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        收件人: {draft.customer_email} | 创建时间: {new Date(draft.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDraft(draft)
                          setShowDetail(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {draft.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleReview(draft.id, "approve")}
                          >
                            <Check className="h-4 w-4 mr-1" />通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(draft.id, "reject")}
                          >
                            <X className="h-4 w-4 mr-1" />拒绝
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(draft.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-600">
            第 {currentPage} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 详情弹窗 */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>邮件详情</DialogTitle>
          </DialogHeader>
          {selectedDraft && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">客户名称</p>
                  <p className="font-medium">{selectedDraft.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">客户邮箱</p>
                  <p className="font-medium">{selectedDraft.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">状态</p>
                  {getStatusBadge(selectedDraft.status)}
                </div>
                <div>
                  <p className="text-sm text-slate-500">创建时间</p>
                  <p>{new Date(selectedDraft.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">邮件主题</p>
                <p className="font-medium">{selectedDraft.subject}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">邮件内容</p>
                <div className="border rounded-lg p-4 bg-slate-50 whitespace-pre-wrap">
                  {selectedDraft.body}
                </div>
              </div>
              {selectedDraft.review_note && (
                <div>
                  <p className="text-sm text-slate-500">审核备注</p>
                  <p className="text-sm text-red-600">{selectedDraft.review_note}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(false)}>
              关闭
            </Button>
            {selectedDraft?.status === "pending" && (
              <>
                <Button onClick={() => handleReview(selectedDraft.id, "approve")}>
                  <Check className="h-4 w-4 mr-1" />通过
                </Button>
                <Button variant="destructive" onClick={() => handleReview(selectedDraft.id, "reject")}>
                  <X className="h-4 w-4 mr-1" />拒绝
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}