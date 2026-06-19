"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2, Check, X, Eye, Clock, AlertCircle, Trash2,
  Loader2, Search, User, FileText, Phone, Building
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface MerchantApplication {
  id: string
  user_id: string
  company_name: string
  credit_code: string
  business_license_url: string
  businessLicense: string
  brand_name: string
  contact_person: string
  contact_phone: string
  is_merchant_verified: boolean | null
  industry: string
  merchant_verify_status: "pending" | "approved" | "rejected" | null
  merchant_reject_reason: string | null
  updated_at: string
}

type TabType = "unverified" | "verified"

export default function MerchantVerificationPage() {
  const [applications, setApplications] = useState<MerchantApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<MerchantApplication | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("unverified")
  const [searchQuery, setSearchQuery] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadApplications = async () => {
    setLoading(true)
    try {
      const url = new URL("/api/admin/merchant-verification", window.location.origin)
      const response = await fetch(url, { credentials: "include" })
      const data = await response.json()
      if (data.ok && Array.isArray(data.data)) {
        setApplications(data.data)
      } else {
        setApplications([])
      }
    } catch (error) {
      console.error("Failed to load applications:", error)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const handleApprove = async (userId: string) => {
    setProcessingId(userId)
    try {
      const response = await fetch("/api/admin/merchant-verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, status: "approved" })
      })
      const data = await response.json()
      if (data.ok) {
        loadApplications()
        setSelectedApplication(null)
      }
    } catch (error) {
      console.error("Failed to approve:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!rejectReason.trim()) {
      alert("请输入拒绝原因")
      return
    }
    setProcessingId(userId)
    try {
      const response = await fetch("/api/admin/merchant-verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, status: "rejected", rejectReason: rejectReason.trim() })
      })
      const data = await response.json()
      if (data.ok) {
        loadApplications()
        setSelectedApplication(null)
        setRejectReason("")
      }
    } catch (error) {
      console.error("Failed to reject:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("确定要取消该商家的认证吗？此操作将关闭商家功能。")) {
      return
    }
    setProcessingId(userId)
    try {
      const response = await fetch("/api/admin/merchant-verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, action: "delete" })
      })
      const data = await response.json()
      if (data.ok) {
        loadApplications()
        setSelectedApplication(null)
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string | null, isVerified: boolean | null) => {
    if (!status) {
      if (isVerified) {
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 border">
            已通过(旧数据)
          </Badge>
        )
      }
      return null
    }
    const styles = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      approved: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200"
    }
    const labels = {
      pending: "待审核",
      approved: "已通过",
      rejected: "已拒绝"
    }
    return (
      <Badge className={`${styles[status as keyof typeof styles]} border`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const filteredApplications = applications.filter(app => {
    const isApproved = app.merchant_verify_status === "approved" || (app.is_merchant_verified && !app.merchant_verify_status)
    const matchesTab = activeTab === "unverified" 
      ? !isApproved
      : isApproved
    const matchesSearch = searchQuery === "" || 
      app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.credit_code?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const unverifiedCount = applications.filter(a => {
    const isApproved = a.merchant_verify_status === "approved" || (a.is_merchant_verified && !a.merchant_verify_status)
    return !isApproved && (a.merchant_verify_status || a.company_name)
  }).length
  const verifiedCount = applications.filter(a => {
    return a.merchant_verify_status === "approved" || (a.is_merchant_verified && !a.merchant_verify_status)
  }).length

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            商家认证管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">审核商家提交的认证申请</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("unverified")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "unverified"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              未认证 <Badge variant="outline" className="ml-2">{unverifiedCount}</Badge>
            </button>
            <button
              onClick={() => setActiveTab("verified")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "verified"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              已认证 <Badge variant="outline" className="ml-2">{verifiedCount}</Badge>
            </button>
          </div>

          <div className="p-4 border-b bg-slate-50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索公司名称、联系人、信用代码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">公司名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">品牌名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">联系人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">信用代码</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {activeTab === "unverified" ? "暂无待审核的认证申请" : "暂无已认证的商家"}
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map(app => (
                    <tr key={app.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{app.company_name || "-"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{app.brand_name || "-"}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{app.contact_person || "-"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-mono text-sm">{app.credit_code || "-"}</td>
                      <td className="py-4 px-4">{getStatusBadge(app.merchant_verify_status, app.is_merchant_verified)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-primary" />
                                  认证详情
                                </DialogTitle>
                                <DialogDescription>查看商家提交的认证信息</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">公司名称</Label>
                                    <p className="text-sm font-medium">{app.company_name || "-"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">品牌名称</Label>
                                    <p className="text-sm font-medium">{app.brand_name || "-"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">统一社会信用代码</Label>
                                    <p className="text-sm font-mono">{app.credit_code || "-"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">所属行业</Label>
                                    <p className="text-sm font-medium">{app.industry || "-"}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">联系人</Label>
                                    <p className="text-sm font-medium flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {app.contact_person || "-"}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-slate-500">联系电话</Label>
                                    <p className="text-sm font-medium flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {app.contact_phone || "-"}
                                    </p>
                                  </div>
                                </div>

                                {(app.business_license_url || app.businessLicense) && (
                                  <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">营业执照</Label>
                                    <div className="border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-colors">
                                      <img
                                        src={app.business_license_url || app.businessLicense}
                                        alt="营业执照"
                                        className="max-h-64 w-full object-contain"
                                        onClick={() => window.open(app.business_license_url || app.businessLicense, '_blank')}
                                      />
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">点击图片在新窗口查看</p>
                                  </div>
                                )}

                                {app.merchant_reject_reason && (
                                  <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                    <Label className="text-xs text-red-600 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      拒绝原因
                                    </Label>
                                    <p className="text-sm text-red-700">{app.merchant_reject_reason}</p>
                                  </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                  {!(app.merchant_verify_status === "approved" || (app.is_merchant_verified && !app.merchant_verify_status) || app.merchant_verify_status === "rejected") && (
                                    <>
                                      <Button
                                        onClick={() => handleApprove(app.user_id)}
                                        disabled={processingId === app.user_id}
                                        className="flex-1"
                                      >
                                        {processingId === app.user_id ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Check className="h-4 w-4 mr-2" />
                                        )}
                                        通过
                                      </Button>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="destructive" className="flex-1">
                                            <X className="h-4 w-4 mr-2" />
                                            拒绝
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                          <DialogHeader>
                                            <DialogTitle>拒绝认证</DialogTitle>
                                            <DialogDescription>请输入拒绝原因，用户将收到通知</DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4 mt-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="rejectReason">拒绝原因</Label>
                                              <Input
                                                id="rejectReason"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                placeholder="请输入拒绝原因..."
                                              />
                                            </div>
                                            <div className="flex gap-3">
                                              <Button
                                                variant="outline"
                                                onClick={() => setRejectReason("")}
                                                className="flex-1"
                                              >
                                                取消
                                              </Button>
                                              <Button
                                                variant="destructive"
                                                onClick={() => handleReject(app.user_id)}
                                                disabled={processingId === app.user_id}
                                                className="flex-1"
                                              >
                                                {processingId === app.user_id ? (
                                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : null}
                                                确认拒绝
                                              </Button>
                                            </div>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </>
                                  )}
                                  {(app.merchant_verify_status === "approved" || (app.is_merchant_verified && !app.merchant_verify_status)) && (
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDelete(app.user_id)}
                                      disabled={processingId === app.user_id}
                                      className="flex-1"
                                    >
                                      {processingId === app.user_id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                      )}
                                      删除认证
                                    </Button>
                                  )}
                                  {app.merchant_verify_status === "rejected" && (
                                    <>
                                      <Button
                                        onClick={() => handleApprove(app.user_id)}
                                        disabled={processingId === app.user_id}
                                        className="flex-1"
                                      >
                                        {processingId === app.user_id ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Check className="h-4 w-4 mr-2" />
                                        )}
                                        重新审核通过
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm("确定要删除这条申请记录吗？")) {
                                handleDelete(app.user_id)
                              }
                            }}
                            disabled={processingId === app.user_id}
                          >
                            {processingId === app.user_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}