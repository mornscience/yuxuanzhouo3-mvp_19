"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Handshake, Inbox, Send, CheckCircle, XCircle,
  Clock, Building2, Mail, Phone, Loader2, User, Sparkles,
} from "lucide-react"
import { t } from "@/lib/market/i18n"

interface CooperationApplication {
  id: string
  leadId: string
  leadOwnerId: string
  applicantId: string
  applicantName: string
  applicantContact: string
  applicantEmail: string
  message: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  updatedAt: string
  leadName?: string
  leadRegion?: string
  leadType?: "b2b" | "vc"
}

// 合并后的申请组
interface AppGroup {
  key: string
  applicantId: string
  applicantName: string
  applicantContact: string
  applicantEmail: string
  message: string
  createdAt: string
  apps: CooperationApplication[]          // 原始申请列表
  // 合并状态：全部同意=approved，有一个拒绝=rejected，否则=pending
  mergedStatus: "pending" | "approved" | "rejected"
}

const glassCard = {
  background: "linear-gradient(135deg,rgba(255,255,255,0.88) 0%,rgba(239,246,255,0.82) 60%,rgba(243,232,255,0.88) 100%)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 4px 24px rgba(59,130,246,0.08),inset 0 1px 0 rgba(255,255,255,0.8)",
}

/** 把申请列表按申请人 + 类型 + 5分钟时间窗口合并 */
function groupApplications(apps: CooperationApplication[]): AppGroup[] {
  const groups: AppGroup[] = []
  const used = new Set<string>()

  for (const app of apps) {
    if (used.has(app.id)) continue
    used.add(app.id)

    const appTime = new Date(app.createdAt).getTime()
    // 只合并：同一申请人 + 同一类型 + 5分钟内
    const siblings = apps.filter(a =>
      !used.has(a.id) &&
      a.applicantId === app.applicantId &&
      a.leadType === app.leadType &&
      Math.abs(new Date(a.createdAt).getTime() - appTime) < 5 * 60 * 1000
    )
    siblings.forEach(s => used.add(s.id))

    const all = [app, ...siblings]
    const statuses = all.map(a => a.status)
    const mergedStatus: AppGroup["mergedStatus"] =
      statuses.every(s => s === "approved") ? "approved" :
      statuses.some(s => s === "rejected") ? "rejected" : "pending"

    groups.push({
      key: app.id,
      applicantId: app.applicantId,
      applicantName: app.applicantName,
      applicantContact: app.applicantContact,
      applicantEmail: app.applicantEmail,
      message: app.message,
      createdAt: app.createdAt,
      apps: all,
      mergedStatus,
    })
  }
  return groups
}

function StatusPill({ status }: { status: string }) {
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle size={10} /> {t("approved")}
    </span>
  )
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-600 border border-red-200">
      <XCircle size={10} /> {t("rejected")}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
      <Clock size={10} /> {t("pending")}
    </span>
  )
}

function TypePill({ type }: { type?: "b2b" | "vc" }) {
  if (type === "b2b") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-600">
      <Building2 size={9} /> Enterprise Lead
    </span>
  )
  if (type === "vc") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-600">
      <Handshake size={9} /> VC / Funding
    </span>
  )
  return null
}

export default function MyApplicationsPage() {
  const router = useRouter()
  const [receivedApps, setReceivedApps] = useState<CooperationApplication[]>([])
  const [sentApps, setSentApps] = useState<CooperationApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received")
  const [selectedGroup, setSelectedGroup] = useState<AppGroup | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState("")

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const [b2bRec, vcRec, b2bSent, vcSent] = await Promise.all([
        fetch("/api/leads/b2b/my-applications?type=received", { credentials: "include" }).then(r => r.json()),
        fetch("/api/leads/vc/my-applications?type=received", { credentials: "include" }).then(r => r.json()),
        fetch("/api/leads/b2b/my-applications?type=sent", { credentials: "include" }).then(r => r.json()),
        fetch("/api/leads/vc/my-applications?type=sent", { credentials: "include" }).then(r => r.json()),
      ])
      const received = [
        ...(b2bRec.ok ? (b2bRec.data?.data || []).map((a: any) => ({ ...a, leadType: "b2b" })) : []),
        ...(vcRec.ok ? (vcRec.data || []).map((a: any) => ({ ...a, leadType: "vc" })) : []),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      const sent = [
        ...(b2bSent.ok ? (b2bSent.data?.data || []).map((a: any) => ({ ...a, leadType: "b2b" })) : []),
        ...(vcSent.ok ? (vcSent.data || []).map((a: any) => ({ ...a, leadType: "vc" })) : []),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setReceivedApps(received)
      setSentApps(sent)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  // 同意/拒绝：对组内所有申请逐一处理
  const handleUpdateStatus = async () => {
    if (!selectedGroup || !actionType) return
    setProcessing(true)
    try {
      await Promise.all(selectedGroup.apps.map(app => {
        const url = app.leadType === "vc" ? "/api/leads/vc/my-applications" : "/api/leads/b2b/my-applications"
        return fetch(url, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: app.id, status: actionType === "approve" ? "approved" : "rejected" }),
        })
      }))
      setSelectedGroup(null); setActionType(null)
      fetchApplications()
      showToast(actionType === "approve" ? "✅ Cooperation approved" : "✅ Application rejected")
    } catch (err) { showToast(`❌ ${err instanceof Error ? err.message : "Action failed"}`) }
    finally { setProcessing(false) }
  }

  const receivedGroups = groupApplications(receivedApps)
  const sentGroups = groupApplications(sentApps)
  const pendingCount = receivedGroups.filter(g => g.mergedStatus === "pending").length

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      <p className="text-sm text-slate-400">{t("loading")}</p>
    </div>
  )

  const EmptyState = ({ icon: Icon, title, sub, btnLabel, btnHref }: any) => (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Icon size={32} className="text-blue-300" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-600">{title}</p>
        <p className="text-sm text-slate-400 mt-1">{sub}</p>
      </div>
      <button onClick={() => router.push(btnHref)} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all">
        {btnLabel}
      </button>
    </div>
  )

  const GroupCard = ({ group, isReceived }: { group: AppGroup; isReceived: boolean }) => {
    const types = [...new Set(group.apps.map(a => a.leadType))]
    const hasMultiple = group.apps.length > 1

    return (
      <div className="rounded-2xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-all duration-300" style={glassCard}>
        {/* 头部 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 ${
              types.length > 1
                ? "bg-gradient-to-br from-blue-500 to-purple-500"
                : types[0] === "vc"
                  ? "bg-gradient-to-br from-purple-500 to-pink-500"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
            }`}>
              {isReceived ? <User size={18} /> : <Building2 size={18} />}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                {isReceived ? group.applicantName : (group.apps[0]?.leadName || t("lead_application"))}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {types.map(t => <TypePill key={t} type={t} />)}
                {hasMultiple && (
                  <span className="text-[10px] text-slate-400 font-medium">· {group.apps.length} applications</span>
                )}
                {!isReceived && group.mergedStatus === "approved" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    ✦ {t("my_coop")}
                  </span>
                )}
              </div>
            </div>
          </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            {/* 申请次数角标 */}
            {group.apps.length > 1 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold shadow-md" title={`${group.apps.length} applications`}>
                {group.apps.length}
              </span>
            )}
            <StatusPill status={group.mergedStatus} />
          </div>
        </div>

        {/* B 收到：联系信息 */}
        {isReceived && (
          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5"><Phone size={11} className="text-blue-400" />{group.applicantContact}</div>
            <div className="flex items-center gap-1.5"><Mail size={11} className="text-blue-400" />{group.applicantEmail}</div>
          </div>
        )}

        {/* A 已同意：合作信息只读 */}
        {!isReceived && group.mergedStatus === "approved" && (
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 px-3 py-2.5 space-y-1">
            <p className="text-xs font-semibold text-blue-700 mb-1">{t("coop_established")}</p>
            {group.applicantContact && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Phone size={10} className="text-blue-400" /> {group.applicantContact}
              </div>
            )}
            {group.applicantEmail && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail size={10} className="text-blue-400" /> {group.applicantEmail}
              </div>
            )}
          </div>
        )}

        {/* 留言 */}
        {group.message && !((!isReceived) && group.mergedStatus === "approved") && (
          <div className="rounded-xl bg-white/60 border border-white/60 px-3 py-2 text-xs text-slate-500">
            <span className="text-slate-400">{isReceived ? "Message: " : "Your message: "}</span>{group.message}
          </div>
        )}

        <p className="text-[11px] text-slate-400">
          {t("apply_time")}{new Date(group.createdAt).toLocaleString("en-US")}
        </p>

        {isReceived && group.mergedStatus === "pending" && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setSelectedGroup(group); setActionType("approve") }}
              className="flex-1 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={13} /> Approve
            </button>
            <button
              onClick={() => { setSelectedGroup(group); setActionType("reject") }}
              className="flex-1 h-9 rounded-xl border border-red-200 bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle size={13} /> Reject
            </button>
          </div>
        )}

        {isReceived && group.mergedStatus === "approved" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-700 font-medium">Added to &quot;My Follow-ups&quot;, view in Merchant Mode</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300/15 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> {t("back")}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">{t("coop_mgmt")}</span>
          </div>
          <button onClick={() => router.push("/market/leads-pool")} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            <Building2 size={15} /> {t("leads_pool")}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 p-1.5 rounded-2xl mb-6 w-fit" style={glassCard}>
          {([
            { key: "received", Icon: Inbox, label: t("received"), badge: pendingCount },
            { key: "sent", Icon: Send, label: t("sent"), badge: 0 },
          ] as const).map(({ key, Icon, label, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === key
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
              }`}
            >
              <Icon size={15} />
              {label}
              {badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? <LoadingState /> : activeTab === "received" ? (
          receivedGroups.length === 0 ? (
            <EmptyState icon={Inbox} title={t("no_received")} sub={t("no_received_sub")} btnLabel={t("go_publish_leads")} btnHref="/market/acquisition?mode=merchant" />
          ) : (
            <div className="space-y-3">
              {receivedGroups.map(g => <GroupCard key={g.key} group={g} isReceived={true} />)}
            </div>
          )
        ) : (
          sentGroups.length === 0 ? (
            <EmptyState icon={Send} title="No applications sent" sub="You haven't applied to any leads yet" btnLabel="Browse Leads Pool" btnHref="/market/leads-pool" />
          ) : (
            <div className="space-y-3">
              {sentGroups.map(g => <GroupCard key={g.key} group={g} isReceived={false} />)}
            </div>
          )
        )}
      </main>

      {/* 确认弹窗 */}
      {selectedGroup && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm mx-3 max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl" style={{
            background: "linear-gradient(135deg,rgba(255,255,255,0.96) 0%,rgba(239,246,255,0.92) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}>
            <div className={`px-6 py-5 ${actionType === "approve" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-red-500 to-rose-500"}`}>
              <h3 className="text-lg font-bold text-white">
                {actionType === "approve" ? t("confirm_agree") + "？" : t("confirm_reject") + "？"}
              </h3>
              <p className="text-white/70 text-xs mt-1">
                {actionType === "approve"
                  ? `Approving ${selectedGroup.apps.length} application(s) from ${selectedGroup.applicantName}`
                  : `Rejecting application from ${selectedGroup.applicantName}`}
              </p>
            </div>
            <div className="p-6 flex gap-3">
              <button onClick={() => { setSelectedGroup(null); setActionType(null) }} className="flex-1 h-11 rounded-full border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors">
                {t("cancel")}
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={processing}
                className={`flex-1 h-11 rounded-full text-white text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${actionType === "approve" ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30" : "bg-gradient-to-r from-red-500 to-rose-500 shadow-red-500/30"}`}
              >
                {processing ? <Loader2 size={15} className="animate-spin" /> : actionType === "approve" ? <CheckCircle size={15} /> : <XCircle size={15} />}
                {actionType === "approve" ? t("confirm_agree") : t("confirm_reject")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium z-50 animate-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  )
}
