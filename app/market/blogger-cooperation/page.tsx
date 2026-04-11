"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Handshake, Send, CheckCircle, Clock, XCircle, FileText, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { t } from "@/lib/market/i18n"

type Tab = "received" | "sent" | "cooperations"

export default function BloggerCooperationPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("received")
  const [received, setReceived] = useState<any[]>([])   // 收到的申请（我是被申请方）
  const [sent, setSent] = useState<any[]>([])            // 我发出的申请
  const [cooperations, setCooperations] = useState<any[]>([])  // 我的合作（我申请成功的）
  const [articles, setArticles] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [approveModal, setApproveModal] = useState<{ app: any; articleId: string; channelIds: string[] } | null>(null)
  const [msgModal, setMsgModal] = useState<{ coop: any; content: string } | null>(null)
  const [pushModal, setPushModal] = useState<{ coop: any; articleId: string; channelIds: string[] } | null>(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [recRes, sentRes, coopRes, artRes, chanRes] = await Promise.all([
        fetch("/api/market/blogger-cooperation?type=applications", { credentials: "include" }),
        fetch("/api/market/blogger-cooperation?type=my_sent", { credentials: "include" }),
        fetch("/api/market/blogger-cooperation?type=cooperations", { credentials: "include" }),
        fetch("/api/market/blogger-cooperation?type=articles", { credentials: "include" }),
        fetch("/api/market/blogger-cooperation?type=channels", { credentials: "include" }),
      ])
      const [recJson, sentJson, coopJson, artJson, chanJson] = await Promise.all([
        recRes.json(), sentRes.json(), coopRes.json(), artRes.json(), chanRes.json()
      ])
      if (recJson.ok) setReceived(recJson.data || [])
      if (sentJson.ok) setSent(sentJson.data || [])
      if (coopJson.ok) setCooperations(coopJson.data || [])
      if (artJson.ok) setArticles(artJson.data || [])
      if (chanJson.ok) setChannels(chanJson.data || [])
    } catch { setError("加载数据失败") }
    finally { setLoading(false) }
  }

  const handleApprove = async () => {
    if (!approveModal) return
    setActionLoading(approveModal.app.id)
    try {
      const res = await fetch("/api/market/blogger-cooperation", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", applicationId: approveModal.app.id, articleId: approveModal.articleId, channelIds: approveModal.channelIds })
      })
      const json = await res.json()
      if (json.ok) { setApproveModal(null); await loadAll(); alert("已同意合作！") }
      else setError(json.message || "操作失败")
    } catch { setError("操作失败") }
    finally { setActionLoading(null) }
  }

  const handleReject = async (app: any) => {
    setActionLoading(app.id + "_r")
    try {
      const res = await fetch("/api/market/blogger-cooperation", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", applicationId: app.id })
      })
      const json = await res.json()
      if (json.ok) await loadAll()
      else setError(json.message || "操作失败")
    } catch { setError("操作失败") }
    finally { setActionLoading(null) }
  }

  const handleSendMessage = async () => {
    if (!msgModal?.content.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/market/blogger-cooperation", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_message", cooperationId: msgModal.coop.id, message: msgModal.content, email: msgModal.coop.email })
      })
      const json = await res.json()
      if (json.ok) { alert("消息发送成功"); setMsgModal(null) }
      else setError(json.message || "发送失败")
    } catch { setError("发送失败") }
    finally { setSending(false) }
  }

  const handlePushArticle = async () => {
    if (!pushModal?.articleId) { alert("请选择要推送的文章"); return }
    setSending(true)
    try {
      const res = await fetch("/api/market/blogger-cooperation", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "push_article",
          cooperationId: pushModal.coop.id,
          articleId: pushModal.articleId,
          channelIds: pushModal.channelIds,
        })
      })
      const json = await res.json()
      if (json.ok) { alert("推广文章已发送给博主！"); setPushModal(null) }
      else alert(json.message || "推送失败")
    } catch { alert("推送失败，请重试") }
    finally { setSending(false) }
  }

  const handleBatchSend = async () => {
    const active = cooperations.filter(c => c.status === "active")
    if (!active.length) { alert("暂无活跃合作博主"); return }
    const msg = prompt("请输入要群发的消息内容：")
    if (!msg?.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/market/blogger-cooperation", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "batch_send", message: msg, cooperationIds: active.map(c => c.id) })
      })
      const json = await res.json()
      if (json.ok) alert(`成功发送给 ${json.count} 位博主`)
      else setError(json.message || "发送失败")
    } catch { setError("发送失败") }
    finally { setSending(false) }
  }

  const badge = (status: string) => {
    const m: Record<string, { label: string; cls: string }> = {
      pending: { label: t("pending"), cls: "bg-yellow-100 text-yellow-700" },
      approved: { label: t("approved"), cls: "bg-green-100 text-green-700" },
      rejected: { label: t("rejected"), cls: "bg-red-100 text-red-700" },
      active: { label: t("cooperating"), cls: "bg-blue-100 text-blue-700" },
    }
    const s = m[status] || { label: status, cls: "bg-gray-100 text-gray-600" }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
  }

  const pendingCount = received.filter(a => a.status === "pending").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} /> {t("back")}
          </button>
          <span className="font-semibold text-slate-800">{t("blogger_coop_mgmt")}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {error && <Alert variant="destructive" className="mb-4"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <div className="flex gap-2 mb-6 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit">
          <button onClick={() => setTab("received")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "received" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>
            <Clock size={14} /> {t("received")}
            {pendingCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>}
          </button>
          <button onClick={() => setTab("sent")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "sent" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>
            <Send size={14} /> {t("sent")}
            <span className="bg-slate-100 text-slate-600 text-xs rounded-full px-1.5 py-0.5">{sent.length}</span>
          </button>
          <button onClick={() => setTab("cooperations")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "cooperations" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>
            <Handshake size={14} /> {t("my_coop")}
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5">{cooperations.length}</span>
          </button>
        </div>

        {/* 收到的申请 - 我是被申请方，可以同意/拒绝 */}
        {tab === "received" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><Clock size={16} className="text-blue-500" /><span className="font-semibold">{t("received_coop_apps")}</span></div>
              <span className="text-xs text-slate-400">同意后对方可向你的博主发送推广文章</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>申请方</TableHead><TableHead>申请方邮箱</TableHead><TableHead>博主昵称</TableHead>
                  <TableHead>平台</TableHead><TableHead>留言</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length:3}).map((_,i) => <TableRow key={i}>{Array.from({length:7}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>)
                : received.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">{t("no_received_coop")}</TableCell></TableRow>
                ) : received.map(app => (
                  <TableRow key={app.id} className="hover:bg-blue-50/30">
                    <TableCell className="font-medium">{app.applicant_name || app.applicantName || "未知"}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{app.applicant_email || app.applicantEmail || "-"}</TableCell>
                    <TableCell>{app.blogger_name || app.bloggerName}</TableCell>
                    <TableCell>{app.platform}</TableCell>
                    <TableCell className="text-slate-500 text-sm max-w-32 truncate">{app.message || "-"}</TableCell>
                    <TableCell>{badge(app.status)}</TableCell>
                    <TableCell className="text-right">
                      {app.status === "pending" ? (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                            onClick={() => setApproveModal({ app, articleId: articles[0]?.id || "", channelIds: [] })}>
                            <CheckCircle size={12} className="mr-1" /> {t("agree")}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                            disabled={actionLoading === app.id + "_r"} onClick={() => handleReject(app)}>
                            <XCircle size={12} className="mr-1" /> {t("reject")}
                          </Button>
                        </div>
                      ) : <span className="text-xs text-slate-400">{t("processed")}</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* 我发出的申请 */}
        {tab === "sent" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2"><Send size={16} className="text-blue-500" /><span className="font-semibold">{t("sent_coop_apps")}</span></div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>博主昵称</TableHead><TableHead>平台</TableHead><TableHead>联系邮箱</TableHead>
                  <TableHead>单条报价</TableHead><TableHead>分成比例</TableHead><TableHead>留言</TableHead><TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length:3}).map((_,i) => <TableRow key={i}>{Array.from({length:7}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>)
                : sent.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">{t("no_sent_coop")}</TableCell></TableRow>
                ) : sent.map(app => (
                  <TableRow key={app.id} className="hover:bg-blue-50/30">
                    <TableCell className="font-medium">{app.blogger_name || app.bloggerName}</TableCell>
                    <TableCell>{app.platform}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{app.email}</TableCell>
                    <TableCell>{app.cost}</TableCell>
                    <TableCell className="text-blue-600 font-medium">{app.commission}</TableCell>
                    <TableCell className="text-slate-500 text-sm max-w-32 truncate">{app.message || "-"}</TableCell>
                    <TableCell>{badge(app.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* 我的合作 */}
        {tab === "cooperations" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><Handshake size={16} className="text-blue-500" /><span className="font-semibold">{t("my_coop_bloggers")}</span></div>
              <Button size="sm" onClick={handleBatchSend} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
                <Send size={13} className="mr-1.5" />{sending ? t("sending") : t("batch_send")}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>博主昵称</TableHead><TableHead>平台</TableHead><TableHead>联系邮箱</TableHead>
                  <TableHead>单条报价</TableHead><TableHead>分成比例</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length:3}).map((_,i) => <TableRow key={i}>{Array.from({length:7}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>)
                : cooperations.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">{t("no_coop_bloggers")}</TableCell></TableRow>
                ) : cooperations.map(coop => (
                  <TableRow key={coop.id} className="hover:bg-blue-50/30">
                    <TableCell className="font-medium">{coop.blogger_name || coop.bloggerName}</TableCell>
                    <TableCell>{coop.platform}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{coop.email}</TableCell>
                    <TableCell>{coop.cost}</TableCell>
                    <TableCell className="text-blue-600 font-medium">{coop.commission}</TableCell>
                    <TableCell>{badge(coop.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => setPushModal({ coop, articleId: articles[0]?.id || "", channelIds: [] })}>
                          <FileText size={12} className="mr-1" /> {t("push_article")}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setMsgModal({ coop, content: "" })}>
                          <Send size={12} className="mr-1" /> {t("send_message")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      {/* 同意合作弹窗 - 直接确认，无需选文章 */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-4">
              <h3 className="text-white font-bold text-lg">{t("confirm_approve_coop")}</h3>
              <p className="text-white/70 text-xs mt-0.5">
                同意后「{approveModal.app.applicant_name || approveModal.app.applicantName}」将加入合作列表，可向你的博主「{approveModal.app.blogger_name || approveModal.app.bloggerName}」发送推广文章
              </p>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">申请方</span><span className="font-medium">{approveModal.app.applicant_name || approveModal.app.applicantName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">博主昵称</span><span className="font-medium">{approveModal.app.blogger_name || approveModal.app.bloggerName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">平台</span><span>{approveModal.app.platform}</span></div>
                {approveModal.app.message && <div className="flex justify-between"><span className="text-slate-500">留言</span><span className="text-slate-600">{approveModal.app.message}</span></div>}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setApproveModal(null)}>{t("cancel")}</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={!!actionLoading}>
                  <CheckCircle size={14} className="mr-1.5" />{actionLoading ? t("processing") : t("confirm_agree")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 推送文章弹窗 */}
      {pushModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4">
              <h3 className="text-white font-bold text-lg">{t("push_promo_article")}</h3>
              <p className="text-white/70 text-xs mt-0.5">向博主「{pushModal.coop.blogger_name || pushModal.coop.bloggerName}」发送推广文章</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <FileText size={14} className="text-blue-500" /> 选择推广文章
                </label>
                {articles.length === 0 ? (
                  <div className="text-sm text-slate-400 bg-slate-50 rounded-xl p-3">
                    暂无文章，<button onClick={() => router.push("/market/article-templates")} className="text-blue-600 underline">去创建</button>
                  </div>
                ) : (
                  <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    value={pushModal.articleId}
                    onChange={e => setPushModal({ ...pushModal, articleId: e.target.value })}>
                    <option value="">-- 请选择文章 --</option>
                    {articles.map((a: any) => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Globe size={14} className="text-purple-500" /> 同步发布到企业频道（可选）
                </label>
                {channels.length === 0 ? (
                  <div className="text-sm text-slate-400 bg-slate-50 rounded-xl p-3">
                    暂无频道，<button onClick={() => router.push("/market/publish-channels")} className="text-blue-600 underline">去添加</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {channels.map((ch: any) => (
                      <label key={ch.id} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${pushModal.channelIds.includes(ch.id) ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-200"}`}>
                        <input type="checkbox" className="accent-blue-600"
                          checked={pushModal.channelIds.includes(ch.id)}
                          onChange={e => {
                            const ids = e.target.checked ? [...pushModal.channelIds, ch.id] : pushModal.channelIds.filter(id => id !== ch.id)
                            setPushModal({ ...pushModal, channelIds: ids })
                          }} />
                        <div><p className="text-xs font-medium text-slate-700">{ch.name}</p><p className="text-[10px] text-slate-400">{ch.platform}</p></div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setPushModal(null)}>{t("cancel")}</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handlePushArticle} disabled={sending}>
                  <Send size={14} className="mr-1.5" />{sending ? t("sending") : t("confirm")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 发消息弹窗 */}
      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4">
              <h3 className="text-white font-bold">发送消息给 {msgModal.coop.blogger_name || msgModal.coop.bloggerName}</h3>
              <p className="text-white/70 text-xs mt-0.5">{msgModal.coop.email}</p>
            </div>
            <div className="p-6 space-y-4">
              <textarea className="w-full border border-slate-200 rounded-xl p-3 text-sm h-32 resize-none focus:outline-none focus:border-blue-400"
                placeholder="请输入消息内容..." value={msgModal.content}
                onChange={e => setMsgModal({ ...msgModal, content: e.target.value })} />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setMsgModal(null)}>{t("cancel")}</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSendMessage} disabled={sending}>
                  {sending ? t("sending") : <><Send size={14} className="mr-1.5" />{t("send_email")}</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
