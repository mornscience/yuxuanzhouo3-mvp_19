"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Send, Trash2, Globe, Building2, TrendingUp, Users, Loader2, Mail, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { t } from "@/lib/market/i18n"

type LeadType = "blogger" | "enterprise" | "vc"
type Lead = {
  id: string; query: string; name: string; email: string; website: string
  description: string; type: LeadType; email_sent: boolean; email_sent_at?: string
  expires_at: string; created_at: string
}

const TYPE_CONFIG = {
  blogger: { label: "Blogger/KOL", icon: Users, color: "bg-blue-100 text-blue-700 border-blue-200" },
  enterprise: { label: "Enterprise", icon: Building2, color: "bg-purple-100 text-purple-700 border-purple-200" },
  vc: { label: "VC Institution", icon: TrendingUp, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
}

export default function AISearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [type, setType] = useState<LeadType>("blogger")
  const [searching, setSearching] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [msgModal, setMsgModal] = useState<{ lead: Lead; subject: string; content: string; toEmail?: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState("")
  const [usage, setUsage] = useState({ balance: 0.1, totalUsed: 0, callCount: 0, costPerCall: 0.0005, remainingCalls: 200, warning: null as string | null })

  const isQuotaExceeded = usage.remainingCalls <= 0

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  useEffect(() => { loadLeads() }, [])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/market/ai-search", { credentials: "include" })
      const json = await res.json()
      if (json.ok) { setLeads(json.data || []); if (json.quota) setUsage(json.quota) }
    } catch {}
    finally { setLoading(false) }
  }

  const handleSearch = async () => {
    if (!query.trim()) { setError("Please enter a search keyword"); return }
    setSearching(true)
    setError("")
    try {
      const res = await fetch("/api/market/ai-search", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), type })
      })
      const json = await res.json()
      if (json.ok) {
        if (json.quota) setUsage(json.quota)
        showToast(`✅ Search complete, found ${json.data?.length || 0} results (~${json.quota?.remainingCalls ?? usage.remainingCalls} remaining)`)
        await loadLeads()
      } else {
        setError(json.message || "Search failed")
      }
    } catch { setError("Search failed, please try again") }
    finally { setSearching(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return
    try {
      await fetch("/api/market/ai-search", {
        method: "DELETE", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      setLeads(prev => prev.filter((l: Lead) => l.id !== id))
      showToast("Deleted")
    } catch {}
  }

  const handleSendEmail = async () => {
    if (!msgModal) return
    setSending(true)
    try {
      const res = await fetch("/api/market/ai-search", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msgModal.lead.id, subject: msgModal.subject, message: msgModal.content, toEmail: msgModal.toEmail })
      })
      const json = await res.json()
      if (json.ok) { showToast("✅ Email sent"); setMsgModal(null); await loadLeads() }
      else setError(json.message || "Send failed")
    } catch { setError("Send failed") }
    finally { setSending(false) }
  }

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} /> {t("back")}
          </button>
          <span className="font-semibold text-slate-800">{t("ai_search_title")}</span>
          <span className="text-xs text-slate-400 ml-1">· Search bloggers / enterprises / VCs, auto-extract contacts</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Search size={16} className="text-blue-500" /> {t("ai_search")}
          </h2>
          <div className="space-y-4">
            {/* 类型选择 */}
            <div className="flex gap-2">
              {(Object.entries(TYPE_CONFIG) as [LeadType, typeof TYPE_CONFIG.blogger][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setType(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${type === key ? cfg.color + " shadow-sm" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  <cfg.icon size={14} /> {cfg.label}
                </button>
              ))}
            </div>
            {/* 搜索输入 */}
            <div className="flex gap-3">
              <Input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isQuotaExceeded && handleSearch()}
                placeholder={`Search ${TYPE_CONFIG[type].label} name, keyword...`}
                className="flex-1 h-11 rounded-xl" />
              <Button onClick={handleSearch} disabled={searching || isQuotaExceeded} className="h-11 px-6 bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50">
                {searching ? <><Loader2 size={15} className="mr-2 animate-spin" />{t("searching")}</> : <><Search size={15} className="mr-2" />{t("ai_search")}</>}
              </Button>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {isQuotaExceeded && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  <span>Insufficient AI search balance, please purchase membership for more credits</span>
                  <button onClick={() => router.push("/market/membership?from=quota")}
                    className="ml-3 text-xs underline font-semibold whitespace-nowrap">Buy Now →</button>
                </AlertDescription>
              </Alert>
            )}
            {!isQuotaExceeded && usage.warning && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertDescription className="text-orange-700">{usage.warning}</AlertDescription>
              </Alert>
            )}
            {/* 用量展示 */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Balance <span className={`font-semibold ${usage.remainingCalls <= 20 ? "text-red-500" : "text-slate-700"}`}>¥{usage.balance.toFixed(4)}</span></span>
                <span>Used <span className="font-semibold text-slate-700">¥{usage.totalUsed.toFixed(4)}</span></span>
                <span>Total calls <span className="font-semibold text-slate-700">{usage.callCount}</span></span>
                <span className={`font-semibold ${usage.remainingCalls <= 20 ? "text-red-500" : usage.remainingCalls <= 50 ? "text-orange-500" : "text-emerald-600"}`}>
                  ~{usage.remainingCalls} remaining
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usage.remainingCalls <= 20 ? "bg-red-500" : usage.remainingCalls <= 50 ? "bg-orange-400" : "bg-blue-500"}`}
                  style={{ width: `${Math.min((usage.totalUsed / (usage.totalUsed + usage.balance || 0.1)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">~¥{usage.costPerCall} per search, ¥0.1 free on signup (~200 searches)</p>
          </div>
        </div>

        {/* 结果列表 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{t("search_results")} <span className="text-slate-400 font-normal text-sm">({leads.length})</span></h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 size={20} className="animate-spin mr-2" /> {t("loading")}
            </div>
          ) : leads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p>{t("no_search_results")}</p>
            </div>
          ) : (
            leads.map(lead => {
              const cfg = TYPE_CONFIG[lead.type as LeadType] || TYPE_CONFIG.blogger
              const days = daysLeft(lead.expires_at)
              return (
                <div key={lead.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                          <cfg.icon size={11} /> {cfg.label}
                        </span>
                        {lead.email_sent && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                            <CheckCircle size={11} /> Email Sent
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${days <= 1 ? "text-red-500" : "text-slate-400"}`}>
                          <Clock size={10} /> Expires in {days}d
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-base">{lead.name || "Unknown"}</h4>
                      {lead.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{lead.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {lead.email && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Mail size={11} className="text-blue-400" /> {lead.email}
                            {lead.email.startsWith("bd@") || lead.email.startsWith("contact@") || lead.email.startsWith("pr@") || lead.email.startsWith("cooperation@") ? (
                              <span className="text-orange-400 text-[10px]">(inferred)</span>
                            ) : null}
                          </span>
                        )}
                        {!lead.email && (
                          <span className="flex items-center gap-1 text-xs text-orange-400">
                            <Mail size={11} /> No email, fill in manually to send
                          </span>
                        )}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                            <Globe size={11} /> {lead.website}
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Query: {lead.query}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => setMsgModal({
                          lead,
                          subject: "Cooperation Invitation from mornbusiness",
                          content: `Hello!\n\nWe are very interested in your business and would love to explore a partnership.\n\nLooking forward to hearing from you!`
                        })}>
                        <Send size={12} className="mr-1" /> {t("send_coop_info")}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(lead.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* 发邮件弹窗 */}
      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4">
              <h3 className="text-white font-bold">{t("send_coop_info")}</h3>
              <p className="text-white/70 text-xs mt-0.5">To: {msgModal.toEmail || msgModal.lead.email || "(please enter email)"}</p>
            </div>
            <div className="p-6 space-y-4">
              {!msgModal.lead.email && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Recipient Email <span className="text-red-500">*</span></label>
                  <Input
                    value={msgModal.toEmail || ""}
                    onChange={e => setMsgModal({ ...msgModal, toEmail: e.target.value })}
                    placeholder="Enter recipient email"
                    className="rounded-xl"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Subject</label>
                <Input value={msgModal.subject} onChange={e => setMsgModal({ ...msgModal, subject: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Message</label>
                <textarea className="w-full border border-slate-200 rounded-xl p-3 text-sm h-36 resize-none focus:outline-none focus:border-blue-400"
                  value={msgModal.content} onChange={e => setMsgModal({ ...msgModal, content: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setMsgModal(null)}>{t("cancel")}</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSendEmail} disabled={sending}>
                  {sending ? <><Loader2 size={14} className="mr-1.5 animate-spin" />{t("sending")}</> : <><Send size={14} className="mr-1.5" />{t("send_email")}</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
