"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Users, Building2, Landmark, PlaySquare, Plus, Trash2, RefreshCcw, X, Check, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type Tab = "bloggers" | "b2b" | "vc" | "ads" | "verify"

const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
  { key: "bloggers", label: "博主线索",  icon: <Users size={15} /> },
  { key: "b2b",      label: "企业线索",  icon: <Building2 size={15} /> },
  { key: "vc",       label: "VC 线索",   icon: <Landmark size={15} /> },
  { key: "ads",      label: "广告任务",  icon: <PlaySquare size={15} /> },
  { key: "verify",   label: "认证审核",  icon: <ShieldCheck size={15} /> },
]

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {children}
    </div>
  )
}

function AddModal({ type, onClose, onSubmit }: { type: Tab; onClose: () => void; onSubmit: (d: Record<string, string>) => void }) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState("")
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleVideoUpload = async (file: File) => {
    setUploading(true); setUploadMsg("上传中...")
    try {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/upload/video", { method: "POST", credentials: "include", body: fd })
      const json = await res.json()
      if (json.ok && json.data?.videoUrl) {
        set("video_url", json.data.videoUrl)
        setUploadMsg("✅ 上传成功")
      } else {
        setUploadMsg(`❌ ${json.message || "上传失败"}`)
      }
    } catch { setUploadMsg("❌ 网络错误") }
    finally { setUploading(false) }
  }
  const configs: Record<string, { title: string; fields: Array<{ name: string; label: string; type?: string; options?: string[] }> }> = {
    bloggers: { title: "录入博主线索", fields: [
      { name: "name", label: "博主昵称" }, { name: "platform", label: "平台" },
      { name: "email", label: "联系邮箱", type: "email" }, { name: "followers", label: "粉丝量" },
      { name: "cost", label: "基础费用" }, { name: "commission", label: "分成比例" },
    ]},
    b2b: { title: "录入企业线索", fields: [
      { name: "name", label: "企业名称" }, { name: "region", label: "所属区域" },
      { name: "contact", label: "联系人" }, { name: "email", label: "联系邮箱", type: "email" },
      { name: "estValue", label: "预估价值" },
    ]},
    vc: { title: "录入 VC 线索", fields: [
      { name: "name", label: "机构名称" }, { name: "region", label: "区域" },
      { name: "contact", label: "联系人" }, { name: "email", label: "联系邮箱", type: "email" },
      { name: "focus", label: "关注领域" },
    ]},
    ads: { title: "新建广告任务", fields: [
      { name: "brand", label: "品牌名称" },
      { name: "type", label: "广告类型", options: ["视频广告", "互动广告", "横幅图片"] },
      { name: "duration", label: "要求时长（秒）" },
      { name: "reward", label: "单次奖励（元）" },
      { name: "video_url", label: "视频（可选）", type: "video_upload" },
    ]},
  }
  const cfg = configs[type]
  if (!cfg) return null
  return (
    <ModalOverlay onClose={onClose}>
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">{cfg.title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
        </CardHeader>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
          <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
            {cfg.fields.map(f => (
              <div key={f.name} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                {f.options ? (
                  <Select onValueChange={v => set(f.name, v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="请选择" /></SelectTrigger>
                    <SelectContent>{f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                ) : f.type === "video_upload" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed text-sm cursor-pointer transition-colors ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"}`}>
                        <PlaySquare size={14} />
                        {uploading ? "上传中..." : "选择 MP4 视频"}
                        <input type="file" accept="video/mp4,video/*" className="hidden" disabled={uploading}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f) }} />
                      </label>
                      {uploadMsg && <span className={`text-xs ${uploadMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{uploadMsg}</span>}
                    </div>
                    {form.video_url && <p className="text-xs text-muted-foreground truncate">已选: {form.video_url.split("/").pop()}</p>}
                    <Input type="text" placeholder="或直接粘贴视频链接 URL" className="h-9"
                      value={form[f.name] || ""} onChange={e => set(f.name, e.target.value)} />
                  </div>
                ) : (
                  <Input required type={f.type || "text"} className="h-9" onChange={e => set(f.name, e.target.value)} />
                )}
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>取消</Button>
            <Button type="submit" size="sm">保存</Button>
          </div>
        </form>
      </Card>
    </ModalOverlay>
  )
}

function RejectModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("")
  return (
    <ModalOverlay onClose={onClose}>
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base text-red-600">拒绝认证申请</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-xs">拒绝原因 <span className="text-red-500">*</span></Label>
          <Textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="请填写拒绝原因，将展示给用户..." className="min-h-[80px] resize-none" />
        </CardContent>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button variant="destructive" size="sm" disabled={!reason.trim()} onClick={() => onConfirm(reason)}>确认拒绝</Button>
        </div>
      </Card>
    </ModalOverlay>
  )
}

export function AcquisitionClient() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("bloggers")
  const [verifySubTab, setVerifySubTab] = useState<"pending" | "reviewed">("pending")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [addModal, setAddModal] = useState<Tab | null>(null)
  const [rejectTarget, setRejectTarget] = useState<any>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/market1/acquisition", { cache: "no-store" })
      if (res.status === 401) { router.replace("/market1/login"); return }
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "加载失败")
      setData(json.data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [router])

  useEffect(() => { void load() }, [load])

  const post = async (body: Record<string, any>) => {
    const res = await fetch("/api/market1/acquisition", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || "操作失败")
    return json
  }

  const handleAdd = async (formData: Record<string, string>) => {
    if (!addModal) return
    const actionMap: Record<Tab, string> = { bloggers: "insert_blogger", b2b: "insert_b2b", vc: "insert_vc", ads: "insert_ad", verify: "" }
    try { await post({ action: actionMap[addModal], ...formData }); showToast("✅ 添加成功"); setAddModal(null); void load() }
    catch (e: any) { showToast(`❌ ${e.message}`) }
  }

  const handleDelete = async (action: string, id: string) => {
    if (!confirm("确认删除？")) return
    try { await post({ action, id }); showToast("✅ 已删除"); void load() }
    catch (e: any) { showToast(`❌ ${e.message}`) }
  }

  const handleApprove = async (item: any) => {
    try {
      await post({ action: "approve_verify", id: item.id, userId: item.user_id, verifyType: item.verify_type })
      showToast("✅ 已通过认证"); void load()
    } catch (e: any) { showToast(`❌ ${e.message}`) }
  }

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return
    try {
      await post({ action: "reject_verify", id: rejectTarget.id, reason })
      showToast("已拒绝"); setRejectTarget(null); void load()
    } catch (e: any) { showToast(`❌ ${e.message}`) }
  }

  const pendingCount = (data?.verifyRequests || []).filter((r: any) => !r.status || r.status === "pending").length

  const verifyTypeBadge = (type: string) =>
    type === "influencer"
      ? <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">达人认证</Badge>
      : <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">商家认证</Badge>

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">已通过</Badge>
    if (status === "rejected") return <Badge variant="destructive" className="text-xs">已拒绝</Badge>
    return <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">待审核</Badge>
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="h-14 border-b bg-background px-6 flex items-center justify-between">
        <div className="font-semibold">2. 产品获客系统</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-1.5">
            <RefreshCcw size={14} />{loading ? "刷新中..." : "刷新"}
          </Button>
          <Button asChild variant="outline" size="sm"><Link href="/market1">返回系统导航</Link></Button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="w-48 border-r bg-background p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition ${tab === t.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {t.icon}{t.label}
              {t.key === "verify" && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{pendingCount}</span>
              )}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6 space-y-4">
          {error && <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {loading && !data && <div className="space-y-3">{Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>}

          {data && (
            <>
              {tab === "bloggers" && (
                <div className="space-y-4">
                  {/* 统计卡片 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "目标博主池", value: data.bloggers?.length || 0, color: "text-blue-600" },
                      { label: "有邮箱可联系", value: (data.bloggers || []).filter((b: any) => b.email).length, color: "text-purple-600" },
                      { label: "已合作", value: (data.bloggers || []).filter((b: any) => b.status === "已签约" || b.status === "已合作").length, color: "text-green-600" },
                      { label: "跟进中", value: (data.bloggers || []).filter((b: any) => b.status === "谈判中" || b.status === "已联系").length, color: "text-orange-500" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl border bg-background p-4">
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold">博主线索 <span className="text-muted-foreground font-normal text-sm">({data.bloggers?.length || 0} 条)</span></h2>
                    <Button size="sm" onClick={() => setAddModal("bloggers")}><Plus size={14} className="mr-1" />录入博主</Button>
                  </div>
                  <Card><Table>
                    <TableHeader><TableRow>
                      <TableHead>昵称 / 平台</TableHead><TableHead>粉丝量</TableHead>
                      <TableHead>联系邮箱</TableHead><TableHead>费用 / 分成</TableHead>
                      <TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {!(data.bloggers?.length) ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">暂无数据</TableCell></TableRow>
                      : data.bloggers.map((b: any) => (
                        <TableRow key={b.id}>
                          <TableCell><div className="font-medium">{b.name}</div><div className="text-xs text-muted-foreground">{b.platform}</div></TableCell>
                          <TableCell>{b.followers}</TableCell>
                          <TableCell className="text-xs">{b.email}</TableCell>
                          <TableCell className="text-xs">{b.cost} / <span className="text-blue-600">{b.commission}</span></TableCell>
                          <TableCell><Badge variant="outline">{b.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete("delete_blogger", b.id)}><Trash2 size={13} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></Card>
                </div>
              )}

              {tab === "b2b" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: "总企业线索", value: data.b2bLeads?.length || 0, color: "text-blue-600" },
                      { label: "跟进中", value: (data.b2bLeads || []).filter((l: any) => l.status === "跟进中" || l.status === "谈判中").length, color: "text-orange-500" },
                      { label: "已转化", value: (data.b2bLeads || []).filter((l: any) => l.status === "已转化" || l.status === "已签约").length, color: "text-green-600" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl border bg-background p-4">
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold">企业线索 <span className="text-muted-foreground font-normal text-sm">({data.b2bLeads?.length || 0} 条)</span></h2>
                    <Button size="sm" onClick={() => setAddModal("b2b")}><Plus size={14} className="mr-1" />录入企业</Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {!(data.b2bLeads?.length) ? <div className="col-span-2 text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">暂无企业线索</div>
                    : data.b2bLeads.map((l: any) => (
                      <Card key={l.id} className="relative">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-red-400" onClick={() => handleDelete("delete_b2b", l.id)}><Trash2 size={13} /></Button>
                        <CardContent className="pt-4 pb-3 space-y-2">
                          <div className="font-semibold">{l.name}</div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>区域：{l.region} · 联系人：{l.contact}</div>
                            <div>邮箱：{l.email}</div>
                            <div className="text-green-600 font-medium">预估价值：{l.est_value || l.estValue}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">{l.status}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {tab === "vc" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: "目标 VC 机构", value: data.vcLeads?.length || 0, color: "text-blue-600" },
                      { label: "已深度链接", value: (data.vcLeads || []).filter((v: any) => v.status === "深度沟通(Pitch)" || v.status === "尽职调查" || v.status === "已投资").length, color: "text-purple-600" },
                      { label: "系统录入数据", value: data.vcLeads?.length || 0, color: "text-emerald-600" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl border bg-background p-4">
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold">VC 线索 <span className="text-muted-foreground font-normal text-sm">({data.vcLeads?.length || 0} 条)</span></h2>
                    <Button size="sm" onClick={() => setAddModal("vc")}><Plus size={14} className="mr-1" />录入 VC</Button>
                  </div>
                  <Card><Table>
                    <TableHeader><TableRow>
                      <TableHead>机构名称</TableHead><TableHead>区域</TableHead>
                      <TableHead>联系人</TableHead><TableHead>关注领域</TableHead>
                      <TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {!(data.vcLeads?.length) ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">暂无数据</TableCell></TableRow>
                      : data.vcLeads.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell>{v.region}</TableCell><TableCell>{v.contact}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{v.focus}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{v.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete("delete_vc", v.id)}><Trash2 size={13} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></Card>
                </div>
              )}

              {tab === "ads" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "广告总数", value: data.ads?.length || 0, color: "text-blue-600" },
                      { label: "投放中", value: (data.ads || []).filter((a: any) => a.status === "投放中").length, color: "text-green-600" },
                      { label: "待审核", value: (data.ads || []).filter((a: any) => a.status === "待审核").length, color: "text-orange-500" },
                      { label: "总观看次数", value: (data.ads || []).reduce((s: number, a: any) => s + (a.views || 0), 0), color: "text-purple-600" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl border bg-background p-4">
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold">广告任务 <span className="text-muted-foreground font-normal text-sm">({data.ads?.length || 0} 条)</span></h2>
                    <Button size="sm" onClick={() => setAddModal("ads")}><Plus size={14} className="mr-1" />新建广告</Button>
                  </div>
                  <Card><Table>
                    <TableHeader><TableRow>
                      <TableHead>品牌</TableHead><TableHead>类型</TableHead><TableHead>时长</TableHead>
                      <TableHead>奖励</TableHead><TableHead>观看次数</TableHead><TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {!(data.ads?.length) ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">暂无广告任务</TableCell></TableRow>
                      : data.ads.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.brand}</TableCell>
                          <TableCell>{a.type}</TableCell><TableCell>{a.duration}</TableCell>
                          <TableCell className="text-emerald-600 font-medium">{a.reward}</TableCell>
                          <TableCell>{a.views || 0}</TableCell>
                          <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete("delete_ad", a.id)}><Trash2 size={13} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></Card>
                </div>
              )}

              {tab === "verify" && (() => {
                const all = data.verifyRequests || []
                const pending  = all.filter((r: any) => !r.status || r.status === "pending")
                const reviewed = all.filter((r: any) => r.status === "approved" || r.status === "rejected")
                const list = verifySubTab === "pending" ? pending : reviewed

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">认证审核</h2>
                      <p className="text-xs text-muted-foreground">达人 / 商家认证申请管理</p>
                    </div>

                    {/* 子 Tab */}
                    <div className="flex rounded-lg bg-muted p-1 w-fit gap-1">
                      <button onClick={() => setVerifySubTab("pending")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${verifySubTab === "pending" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        待审核
                        {pending.length > 0 && <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{pending.length}</span>}
                      </button>
                      <button onClick={() => setVerifySubTab("reviewed")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${verifySubTab === "reviewed" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        已审核 ({reviewed.length})
                      </button>
                    </div>

                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>用户 ID</TableHead>
                            <TableHead>认证类型</TableHead>
                            <TableHead>申请信息</TableHead>
                            <TableHead>申请时间</TableHead>
                            <TableHead>状态</TableHead>
                            {verifySubTab === "reviewed" && <TableHead>批注 / 原因</TableHead>}
                            {verifySubTab === "pending" && <TableHead className="text-right">操作</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {list.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                {verifySubTab === "pending" ? "暂无待审核申请" : "暂无已审核记录"}
                              </TableCell>
                            </TableRow>
                          ) : list.map((r: any) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-xs">{String(r.user_id || "").slice(0, 14)}…</TableCell>
                              <TableCell>{verifyTypeBadge(r.verify_type)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                                {r.verify_type === "influencer" && (
                                  <div className="space-y-0.5">
                                    {r.platform && <div>平台：{r.platform}</div>}
                                    {r.platform_account && <div>账号：{r.platform_account}</div>}
                                    {r.followers && <div>粉丝：{r.followers}</div>}
                                  </div>
                                )}
                                {r.verify_type === "merchant" && (
                                  <div className="space-y-0.5">
                                    {r.company_name && <div>公司：{r.company_name}</div>}
                                    {r.credit_code && <div>信用代码：{r.credit_code}</div>}
                                    {r.industry && <div>行业：{r.industry}</div>}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {r.created_at ? new Date(r.created_at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}
                              </TableCell>
                              <TableCell>{statusBadge(r.status || "pending")}</TableCell>
                              {verifySubTab === "reviewed" && (
                                <TableCell className="text-xs max-w-[200px]">
                                  {r.status === "approved" && (
                                    <span className="text-muted-foreground">
                                      审核人：{r.reviewed_by || "-"}
                                      {r.reviewed_at && <span className="ml-1">· {new Date(r.reviewed_at).toLocaleDateString()}</span>}
                                    </span>
                                  )}
                                  {r.status === "rejected" && (
                                    <div className="space-y-0.5">
                                      <div className="text-red-600 font-medium">拒绝原因：</div>
                                      <div className="text-muted-foreground">{r.reject_reason || "（未填写）"}</div>
                                      <div className="text-muted-foreground text-[10px]">审核人：{r.reviewed_by || "-"}</div>
                                    </div>
                                  )}
                                </TableCell>
                              )}
                              {verifySubTab === "pending" && (
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                      onClick={() => handleApprove(r)}>
                                      <Check size={12} className="mr-1" />通过
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                                      onClick={() => setRejectTarget(r)}>
                                      <X size={12} className="mr-1" />拒绝
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                )
              })()}
            </>
          )}
        </main>
      </div>

      {addModal && addModal !== "verify" && (
        <AddModal type={addModal} onClose={() => setAddModal(null)} onSubmit={handleAdd} />
      )}
      {rejectTarget && (
        <RejectModal onClose={() => setRejectTarget(null)} onConfirm={handleReject} />
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-xl text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
