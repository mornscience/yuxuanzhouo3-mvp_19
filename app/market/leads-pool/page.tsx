"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, Landmark, Filter, ArrowLeft, Handshake,
  MapPin, DollarSign, Loader2, Send, TrendingUp, Sparkles, X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AcquisitionB2BLead, AcquisitionVCLead } from "@/lib/market/acquisition-types"
import { t } from "@/lib/market/i18n"

type PoolType = "b2b" | "vc"

export default function LeadsPoolPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<PoolType>("b2b")

  const [b2bLeads, setB2bLeads] = useState<AcquisitionB2BLead[]>([])
  const [b2bLoading, setB2bLoading] = useState(true)
  const [b2bError, setB2bError] = useState("")
  const [b2bFilters, setB2bFilters] = useState({ region: "", status: "", sortBy: "newest" as "newest" | "highestValue" })

  const [vcLeads, setVcLeads] = useState<AcquisitionVCLead[]>([])
  const [vcLoading, setVcLoading] = useState(true)
  const [vcError, setVcError] = useState("")
  const [vcFilters, setVcFilters] = useState({ region: "", focus: "", sortBy: "newest" as "newest" | "highestFunding" })

  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [selectedB2BLead, setSelectedB2BLead] = useState<AcquisitionB2BLead | null>(null)
  const [selectedVCLead, setSelectedVCLead] = useState<AcquisitionVCLead | null>(null)
  const [applyForm, setApplyForm] = useState({ applicantName: "", applicantContact: "", applicantEmail: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState("")

  const MAX_APPLY = 15
  const APPLY_COUNT_KEY = "leads_apply_counts"

  // 本地申请次数：{ [leadId]: count }
  const [applyCounts, setApplyCounts] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(APPLY_COUNT_KEY) || "{}") } catch { return {} }
  })

  const getApplyCount = (leadId: string) => applyCounts[leadId] || 0

  const incrementApplyCount = (leadId: string) => {
    setApplyCounts(prev => {
      const next = { ...prev, [leadId]: (prev[leadId] || 0) + 1 }
      try { localStorage.setItem(APPLY_COUNT_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const fetchB2BLeads = useCallback(async () => {
    setB2bLoading(true); setB2bError("")
    try {
      const params = new URLSearchParams()
      if (b2bFilters.region) params.set("region", b2bFilters.region)
      if (b2bFilters.status) params.set("status", b2bFilters.status)
      params.set("sortBy", b2bFilters.sortBy)
      const res = await fetch(`/api/leads/b2b/public-list?${params}`, { credentials: "include" })
      const json = await res.json()
      if (!json.ok) throw new Error(json.message || "Failed to load")
      setB2bLeads(json.data?.data || [])
    } catch (err) { setB2bError(err instanceof Error ? err.message : "Failed to load") }
    finally { setB2bLoading(false) }
  }, [b2bFilters])

  const fetchVCLeads = useCallback(async () => {
    setVcLoading(true); setVcError("")
    try {
      const params = new URLSearchParams()
      if (vcFilters.region) params.set("region", vcFilters.region)
      if (vcFilters.focus) params.set("focus", vcFilters.focus)
      params.set("sortBy", vcFilters.sortBy)
      const res = await fetch(`/api/leads/vc/public-list?${params}`, { credentials: "include" })
      const json = await res.json()
      if (!json.ok) throw new Error(json.message || "Failed to load")
      setVcLeads(json.data?.data || [])
    } catch (err) { setVcError(err instanceof Error ? err.message : "Failed to load") }
    finally { setVcLoading(false) }
  }, [vcFilters])

  useEffect(() => { fetchB2BLeads() }, [fetchB2BLeads])
  useEffect(() => { fetchVCLeads() }, [fetchVCLeads])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    const isVC = !!selectedVCLead
    const leadId = selectedB2BLead?.id || selectedVCLead?.id
    if (!leadId) return
    setSubmitting(true)
    try {
      const url = isVC ? "/api/leads/vc/apply-cooperation" : "/api/leads/b2b/apply-cooperation"
      const res = await fetch(url, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, ...applyForm }),
      })
      const json = await res.json()
      if (json.ok) {
        setApplyDialogOpen(false)
        setApplyForm({ applicantName: "", applicantContact: "", applicantEmail: "", message: "" })
        incrementApplyCount(leadId)
        const count = getApplyCount(leadId) + 1
        showToast(isVC ? `✅ Connection request submitted! (${count})` : `✅ Cooperation request submitted! (${count})`)
      } else throw new Error(json.message || "Application failed")
    } catch (err) { showToast(`❌ ${err instanceof Error ? err.message : "Application failed"}`) }
    finally { setSubmitting(false) }
  }

  const glassCard = {
    background: "linear-gradient(135deg,rgba(255,255,255,0.88) 0%,rgba(239,246,255,0.82) 60%,rgba(243,232,255,0.88) 100%)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.6)",
    boxShadow: "0 4px 24px rgba(59,130,246,0.08),inset 0 1px 0 rgba(255,255,255,0.8)",
  }

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      <p className="text-sm text-slate-400">{t("loading")}</p>
    </div>
  )

  const EmptyState = ({ icon: Icon, title, sub, action }: { icon: any; title: string; sub: string; action: string }) => (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Icon size={32} className="text-blue-300" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-600">{title}</p>
        <p className="text-sm text-slate-400 mt-1">{sub}</p>
      </div>
      <button
        onClick={() => router.push("/market/acquisition?mode=merchant")}
        className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
      >
        {action}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-x-hidden">
      {/* bg blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            {t("back")}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              {activeTab === "b2b" ? t("enterprise_leads_pool") : t("vc_leads_pool")}
            </span>
          </div>
          <button
            onClick={() => router.push("/market/my-applications")}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <Handshake size={15} />
            {t("my_applications")}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6">

        {/* Tab switcher */}
        <div className="flex gap-2 p-1.5 rounded-2xl mb-6 w-fit" style={glassCard}>
          {([["b2b", Building2, t("enterprise_leads")], ["vc", Landmark, t("vc_leads_pool")]] as const).map(([tab, Icon, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === tab
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="rounded-2xl p-4 mb-6" style={glassCard}>
          {activeTab === "b2b" ? (
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs text-slate-400 mb-1.5 block">{t("region")}</Label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder={t("region_placeholder")} className="pl-8 h-9 rounded-xl bg-white/60 border-white/60 text-sm" value={b2bFilters.region} onChange={e => setB2bFilters(p => ({ ...p, region: e.target.value }))} />
                </div>
              </div>
              <div className="w-full sm:w-40">
                <Label className="text-xs text-slate-400 mb-1.5 block">{t("progress_status")}</Label>
                <Select value={b2bFilters.status || "all"} onValueChange={v => setB2bFilters(p => ({ ...p, status: v === "all" ? "" : v }))}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/60 border-white/60 text-sm"><SelectValue placeholder={t("all")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all")}</SelectItem>
                    <SelectItem value="初步接触">Initial Contact</SelectItem>
                    <SelectItem value="跟进中">Following Up</SelectItem>
                    <SelectItem value="合同拟定">Contract Draft</SelectItem>
                    <SelectItem value="已转化">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-36">
                <Label className="text-xs text-slate-400 mb-1.5 block">{t("sort")}</Label>
                <Select value={b2bFilters.sortBy} onValueChange={v => setB2bFilters(p => ({ ...p, sortBy: v as any }))}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/60 border-white/60 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("latest")}</SelectItem>
                    <SelectItem value="highestValue">Highest Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button onClick={fetchB2BLeads} className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium shadow-md shadow-blue-500/20 hover:-translate-y-0.5 transition-all">
                <Filter size={13} /> {t("filter")}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs text-slate-400 mb-1.5 block">{t("region")}</Label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder={t("region_placeholder")} className="pl-8 h-9 rounded-xl bg-white/60 border-white/60 text-sm" value={vcFilters.region} onChange={e => setVcFilters(p => ({ ...p, region: e.target.value }))} />
                </div>
              </div>
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs text-slate-400 mb-1.5 block">{t("industry")}</Label>
                <div className="relative">
                  <TrendingUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input placeholder={t("industry_placeholder")} className="pl-8 h-9 rounded-xl bg-white/60 border-white/60 text-sm" value={vcFilters.focus} onChange={e => setVcFilters(p => ({ ...p, focus: e.target.value }))} />
                </div>
              </div>
              <div className="w-full sm:w-36">
                <Label className="text-xs text-slate-400 mb-1.5 block">{t("sort")}</Label>
                <Select value={vcFilters.sortBy} onValueChange={v => setVcFilters(p => ({ ...p, sortBy: v as any }))}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/60 border-white/60 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("latest")}</SelectItem>
                    <SelectItem value="highestFunding">Highest Funding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button onClick={fetchVCLeads} className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium shadow-md shadow-purple-500/20 hover:-translate-y-0.5 transition-all">
                <Filter size={13} /> {t("filter")}
              </button>
            </div>
          )}
        </div>

        {/* Cards grid */}
        {activeTab === "b2b" ? (
          b2bLoading ? <LoadingState /> :
          b2bError ? (
            <div className="text-center py-12 text-red-400 text-sm">{b2bError} <button className="ml-2 text-blue-500 underline" onClick={fetchB2BLeads}>Retry</button></div>
          ) : b2bLeads.length === 0 ? (
            <EmptyState icon={Building2} title="No leads yet" sub="No companies have published leads to the pool" action="Publish My Leads" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {b2bLeads.map(lead => (
                <div key={lead.id} className="rounded-2xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300" style={glassCard}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0">
                        {lead.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{lead.name}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">{lead.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-400" />{lead.region}</div>
                    <div className="flex items-center gap-1.5"><Building2 size={12} className="text-blue-400" />Contact: {lead.contact}</div>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold"><DollarSign size={12} />Est. Value: {lead.estValue}</div>
                  </div>
                  {(lead.cooperationCount ?? 0) > 0 && (
                    <p className="text-[11px] text-blue-500 bg-blue-50 rounded-lg px-2.5 py-1">{t("companies_applied", { n: lead.cooperationCount ?? 0 })}</p>
                  )}
                  {lead.description && <p className="text-xs text-slate-400 line-clamp-2">{lead.description}</p>}
                  <button
                    onClick={() => { setSelectedB2BLead(lead); setSelectedVCLead(null); setApplyDialogOpen(true) }}
                    disabled={getApplyCount(lead.id) >= MAX_APPLY}
                    className={`mt-auto w-full h-9 rounded-xl text-white text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                      getApplyCount(lead.id) >= MAX_APPLY
                        ? "bg-slate-300 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                    }`}
                  >
                    <Handshake size={14} />
                  {getApplyCount(lead.id) >= MAX_APPLY
                      ? "Apply limit reached"
                      : getApplyCount(lead.id) > 0
                        ? `${t("apply_coop_btn")} (${getApplyCount(lead.id)}/${MAX_APPLY})`
                        : t("apply_coop_btn")
                    }
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          vcLoading ? <LoadingState /> :
          vcError ? (
            <div className="text-center py-12 text-red-400 text-sm">{vcError} <button className="ml-2 text-blue-500 underline" onClick={fetchVCLeads}>Retry</button></div>
          ) : vcLeads.length === 0 ? (
            <EmptyState icon={Landmark} title="No funding demands yet" sub="No companies have published funding demands to the VC pool" action="Post Funding Demand" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vcLeads.map(lead => (
                <div key={lead.id} className="rounded-2xl p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300" style={glassCard}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0">
                        {lead.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{lead.name}</p>
                        {lead.fundingStage && <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">{lead.fundingStage}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5"><MapPin size={12} className="text-purple-400" />{lead.region}</div>
                    <div className="flex items-center gap-1.5"><TrendingUp size={12} className="text-purple-400" />Industry: {lead.focus}</div>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold"><DollarSign size={12} />Funding: {lead.fundingAmount}</div>
                  </div>
                  {(lead.cooperationCount ?? 0) > 0 && (
                    <p className="text-[11px] text-purple-500 bg-purple-50 rounded-lg px-2.5 py-1">{t("investors_applied", { n: lead.cooperationCount ?? 0 })}</p>
                  )}
                  {lead.description && <p className="text-xs text-slate-400 line-clamp-2">{lead.description}</p>}
                  <button
                    onClick={() => { setSelectedVCLead(lead); setSelectedB2BLead(null); setApplyDialogOpen(true) }}
                    disabled={getApplyCount(lead.id) >= MAX_APPLY}
                    className={`mt-auto w-full h-9 rounded-xl text-white text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                      getApplyCount(lead.id) >= MAX_APPLY
                        ? "bg-slate-300 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5"
                    }`}
                  >
                    <Handshake size={14} />
                  {getApplyCount(lead.id) >= MAX_APPLY
                      ? "Apply limit reached"
                      : getApplyCount(lead.id) > 0
                        ? `${t("apply_connect")} (${getApplyCount(lead.id)}/${MAX_APPLY})`
                        : t("apply_connect")
                    }
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* Apply Modal */}
      {applyDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl mx-3 max-h-[92vh] flex flex-col" style={{
            background: "linear-gradient(135deg,rgba(255,255,255,0.96) 0%,rgba(239,246,255,0.92) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}>
            {/* Modal header */}
            <div className={`px-6 py-5 relative overflow-hidden ${selectedVCLead ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"}`}>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedVCLead ? t("apply_connect") : t("apply_coop_btn")}</h3>
                  <p className="text-white/70 text-xs mt-0.5">Apply to {selectedB2BLead?.name || selectedVCLead?.name}</p>
                </div>
                <button onClick={() => setApplyDialogOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleApply} className="p-4 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your {selectedVCLead ? "Institution" : "Company"} / Name *</Label>
                <Input required value={applyForm.applicantName} onChange={e => setApplyForm(p => ({ ...p, applicantName: e.target.value }))} placeholder={selectedVCLead ? "e.g. Sequoia Capital" : "e.g. Acme Corp"} className="h-11 rounded-xl border-slate-200 bg-slate-50/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Phone *</Label>
                <Input required value={applyForm.applicantContact} onChange={e => setApplyForm(p => ({ ...p, applicantContact: e.target.value }))} placeholder="e.g. +1 555 0100" className="h-11 rounded-xl border-slate-200 bg-slate-50/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Email *</Label>
                <Input required type="email" value={applyForm.applicantEmail} onChange={e => setApplyForm(p => ({ ...p, applicantEmail: e.target.value }))} placeholder="e.g. contact@company.com" className="h-11 rounded-xl border-slate-200 bg-slate-50/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{selectedVCLead ? "Connection Intent" : "Cooperation Intent"}</Label>
                <Textarea value={applyForm.message} onChange={e => setApplyForm(p => ({ ...p, message: e.target.value }))} placeholder="Briefly describe your intent and strengths..." rows={3} className="rounded-xl border-slate-200 bg-slate-50/50 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setApplyDialogOpen(false)} className="flex-1 h-11 rounded-full border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors">
                  {t("cancel")}
                </button>
                <button type="submit" disabled={submitting} className={`flex-1 h-11 rounded-full text-white text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${selectedVCLead ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/30" : "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/30"}`}>
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium z-50 animate-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  )
}
