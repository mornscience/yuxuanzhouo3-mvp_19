"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Sparkles, TrendingUp, TrendingDown,
  Gift, CreditCard, PlusCircle, RefreshCw, Wallet,
  Filter
} from "lucide-react"
import { t } from "@/lib/market/i18n"

interface Transaction {
  _id?: string
  id?: string
  userId: string
  type: "reward" | "recharge" | "withdraw" | "charge" | "refund"
  amount: string
  balance: string
  orderId?: string
  status: string
  remark?: string
  created_at: string
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; sign: "+" | "-" }> = {
  reward:   { label: "任务奖励", icon: Gift,        color: "text-emerald-600", bg: "bg-emerald-100", sign: "+" },
  recharge: { label: "充值",     icon: PlusCircle,  color: "text-blue-600",   bg: "bg-blue-100",    sign: "+" },
  refund:   { label: "退款",     icon: RefreshCw,   color: "text-cyan-600",   bg: "bg-cyan-100",    sign: "+" },
  withdraw: { label: "提现",     icon: TrendingDown,color: "text-orange-500", bg: "bg-orange-100",  sign: "-" },
  charge:   { label: "扣费",     icon: CreditCard,  color: "text-red-500",    bg: "bg-red-100",     sign: "-" },
}

const FILTERS = [
  { key: "", label: "全部" },
  { key: "reward",   label: "任务奖励" },
  { key: "recharge", label: "充值" },
  { key: "withdraw", label: "提现" },
  { key: "charge",   label: "扣费" },
  { key: "refund",   label: "退款" },
]

export default function TransactionsPage() {
  const router = useRouter()
  const [list, setList] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [balance, setBalance] = useState("0.00")

  const fetchData = (type: string) => {
    setLoading(true)
    const url = type ? `/api/wallet/transactions?type=${type}` : "/api/wallet/transactions"
    fetch(url, { credentials: "include" })
      .then(r => r.json())
      .then(json => {
        if (json.ok || json.success) {
          const data = json.data || {}
          setList(data.list || [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  // 同时拉余额
  useEffect(() => {
    fetch("/api/wallet/info", { credentials: "include" })
      .then(r => r.json())
      .then(json => { if (json.ok || json.success) setBalance((json.data || {}).balance || "0.00") })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchData(filter) }, [filter])

  const glassCard = {
    background: "linear-gradient(135deg,rgba(255,255,255,0.88) 0%,rgba(239,246,255,0.82) 60%,rgba(243,232,255,0.88) 100%)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.6)",
    boxShadow: "0 4px 24px rgba(59,130,246,0.08),inset 0 1px 0 rgba(255,255,255,0.8)",
  }

  // 按日期分组
  const grouped: Record<string, Transaction[]> = {}
  list.forEach(tx => {
    const day = tx.created_at
      ? new Date(tx.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
      : "未知日期"
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(tx)
  })

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
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
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
            <span className="font-semibold text-slate-800 text-sm">{t("transactions_title")}</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* 余额卡片 */}
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#2563eb 0%,#4f46e5 45%,#7c3aed 100%)",
            boxShadow: "0 8px 32px rgba(59,130,246,0.35)",
          }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-1/3 w-28 h-28 rounded-full bg-white/5" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-white/60" />
                <span className="text-white/60 text-xs">当前余额</span>
              </div>
              <p className="text-3xl font-bold text-white">¥ {balance}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-xs mb-1">共 {list.length} 条记录</p>
              <div className="flex items-center gap-1 justify-end">
                <TrendingUp size={13} className="text-green-300" />
                <span className="text-white/80 text-sm font-medium">
                  +¥{list.filter(t => ["reward","recharge","refund"].includes(t.type))
                    .reduce((s, t) => s + Math.abs(parseFloat(t.amount || "0")), 0).toFixed(2)}
                </span>
              </div>
              <p className="text-white/40 text-[10px]">累计收入</p>
            </div>
          </div>
        </div>

        {/* 类型筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.key
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md shadow-blue-500/25"
                  : "bg-white/70 text-slate-500 border border-white/60 hover:bg-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 流水列表 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">加载中...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Filter size={28} className="text-blue-300" />
            </div>
            <p className="text-slate-500 font-medium">{t("no_tasks")}</p>
            <p className="text-slate-400 text-sm">完成任务、充值或提现后将显示在这里</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([day, txs]) => (
              <div key={day}>
                {/* 日期分组标题 */}
                <p className="text-xs text-slate-400 font-medium mb-2 px-1">{day}</p>
                <div className="rounded-2xl overflow-hidden" style={glassCard}>
                  {txs.map((tx, i) => {
                    const cfg = TYPE_CONFIG[tx.type] || { label: tx.type, icon: Wallet, color: "text-slate-500", bg: "bg-slate-100", sign: "+" }
                    const Icon = cfg.icon
                    const isIncome = cfg.sign === "+"
                    const absAmount = Math.abs(parseFloat(tx.amount || "0")).toFixed(2)
                    return (
                      <div
                        key={tx._id || tx.id || i}
                        className={`flex items-center justify-between px-4 py-3.5 hover:bg-blue-50/40 transition-colors ${i < txs.length - 1 ? "border-b border-white/60" : ""}`}
                      >
                        {/* 左侧 */}
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                            <Icon size={16} className={cfg.color} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{cfg.label}</p>
                            {tx.remark && (
                              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[180px] truncate">{tx.remark}</p>
                            )}
                            <p className="text-[10px] text-slate-300 mt-0.5">
                              {tx.created_at ? new Date(tx.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : ""}
                              {tx.status === "success" ? "" : <span className="ml-1 text-amber-400">{tx.status}</span>}
                            </p>
                          </div>
                        </div>

                        {/* 右侧 */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-base font-bold ${isIncome ? "text-emerald-600" : "text-red-500"}`}>
                            {cfg.sign}¥{absAmount}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">余额 ¥{parseFloat(tx.balance || "0").toFixed(2)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
