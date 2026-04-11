"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, CheckCircle, Sparkles, Clock, Gift,
  TrendingUp, Wallet, PlaySquare
} from "lucide-react"
import { t } from "@/lib/market/i18n"

interface TaskItem {
  id: string
  adId: string
  status: string
  rewardEarned: string
  completedAt: string | null
  createdAt: string
  ad: {
    id: string
    brand: string
    type: string
    duration: string
    reward: string
    videoUrl: string
  } | null
}

export default function MyTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEarned, setTotalEarned] = useState("0.00")

  useEffect(() => {
    fetch("/api/ad/my-tasks?status=已完成", { credentials: "include" })
      .then(r => r.json())
      .then(json => {
        if (json.ok) {
          const list: TaskItem[] = json.data?.list || []
          setTasks(list)
          const sum = list.reduce((acc, t) => acc + parseFloat(t.rewardEarned || "0"), 0)
          setTotalEarned(sum.toFixed(2))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const glassCard = {
    background: "linear-gradient(135deg,rgba(255,255,255,0.88) 0%,rgba(239,246,255,0.82) 60%,rgba(243,232,255,0.88) 100%)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.6)",
    boxShadow: "0 4px 24px rgba(59,130,246,0.08),inset 0 1px 0 rgba(255,255,255,0.8)",
  }

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
            <span className="font-semibold text-slate-800 text-sm">{t("task_completed")}</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* 统计卡片 */}
        {!loading && tasks.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 flex items-center gap-3" style={glassCard}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md flex-shrink-0">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400">完成任务</p>
                <p className="text-xl font-bold text-slate-800">{tasks.length} 个</p>
              </div>
            </div>
            <div className="rounded-2xl p-4 flex items-center gap-3" style={glassCard}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
                <Gift size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400">累计获得</p>
                <p className="text-xl font-bold text-emerald-600">¥{totalEarned}</p>
              </div>
            </div>
          </div>
        )}

        {/* 列表 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">{t("loading")}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <PlaySquare size={32} className="text-blue-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-600">{t("no_tasks")}</p>
              <p className="text-sm text-slate-400 mt-1">去广告广场观看广告，完成后奖励自动到账</p>
            </div>
            <button
              onClick={() => router.push("/market/acquisition?mode=task")}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
            >
              去做任务
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="rounded-2xl p-4 flex items-center justify-between gap-3"
                style={glassCard}
              >
                {/* 左侧 */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <CheckCircle size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {task.ad?.brand || "未知广告"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.ad?.duration && (
                        <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                          <Clock size={10} />{task.ad.duration}
                        </span>
                      )}
                      {task.ad?.type && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-medium">
                          {task.ad.type}
                        </span>
                      )}
                    </div>
                    {task.completedAt && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(task.completedAt).toLocaleString("zh-CN", {
                          month: "2-digit", day: "2-digit",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* 右侧奖励 */}
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-emerald-600">+¥{task.rewardEarned}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">已到账</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
