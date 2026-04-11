"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Play, Pause, CheckCircle, Loader2,
  Volume2, VolumeX, Sparkles, Clock, Gift
} from "lucide-react"

interface Ad {
  id: string
  brand: string
  type: string
  duration: string   // e.g. "30s" or "30"
  reward: string
  videoUrl?: string
  status: string
}

/** 把 "30s" / "1m30s" / "90" 等格式解析成秒数 */
function parseDurationSecs(raw: string): number {
  if (!raw) return 30
  const s = raw.trim().toLowerCase()
  // 纯数字
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  // "30s"
  const secOnly = s.match(/^(\d+)s$/)
  if (secOnly) return parseInt(secOnly[1], 10)
  // "1m30s" or "1m"
  const minsec = s.match(/(?:(\d+)m)?(?:(\d+)s)?/)
  if (minsec) {
    const m = parseInt(minsec[1] || "0", 10)
    const sec = parseInt(minsec[2] || "0", 10)
    return m * 60 + sec
  }
  return 30
}

export function AdPlayClient({ adId }: { adId: string }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 播放状态
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0) // 0-100

  // 倒计时
  const [totalSecs, setTotalSecs] = useState(30)
  const [remainSecs, setRemainSecs] = useState(30)
  const [countdownStarted, setCountdownStarted] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 结算
  const [completed, setCompleted] = useState(false)   // 倒计时结束
  const [settling, setSettling] = useState(false)
  const [settled, setSettled] = useState(false)
  const [reward, setReward] = useState("")
  const [settleError, setSettleError] = useState("")

  // 加载广告详情
  useEffect(() => {
    fetch(`/api/ad/detail/${adId}`, { credentials: "include" })
      .then(r => r.json())
      .then(json => {
        if (json.ok && json.data?.ad) {
          const a = json.data.ad as Ad
          setAd(a)
          const secs = parseDurationSecs(a.duration)
          setTotalSecs(secs)
          setRemainSecs(secs)
        } else {
          setError(json.message || "广告不存在")
        }
      })
      .catch(() => setError("加载失败，请重试"))
      .finally(() => setLoading(false))
  }, [adId])

  // 启动倒计时
  const startCountdown = useCallback(() => {
    if (countdownStarted) return
    setCountdownStarted(true)
    countdownRef.current = setInterval(() => {
      setRemainSecs(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          setCompleted(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [countdownStarted])

  // 清理定时器
  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current) }, [])

  // 视频播放时启动倒计时
  const handlePlay = () => {
    setPlaying(true)
    startCountdown()
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setVideoProgress((v.currentTime / v.duration) * 100)
  }

  // 视频自然结束也触发完成
  const handleEnded = () => {
    setPlaying(false)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setRemainSecs(0)
    setCompleted(true)
  }

  // 结算奖励
  const handleSettle = useCallback(async () => {
    if (settling || settled) return
    setSettling(true)
    setSettleError("")
    try {
      const res = await fetch("/api/ad/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
      })
      const json = await res.json()
      if (json.ok) {
        setReward(json.data?.reward || ad?.reward || "0")
        setSettled(true)
        // 3 秒后自动跳回广场
        setTimeout(() => router.push("/market/acquisition?mode=task"), 3000)
      } else {
        setSettleError(json.message || "结算失败，请重试")
      }
    } catch {
      setSettleError("网络错误，请重试")
    } finally {
      setSettling(false)
    }
  }, [adId, ad, settling, settled, router])

  // 倒计时结束后自动结算
  useEffect(() => {
    if (completed && !settled && !settling) {
      handleSettle()
    }
  }, [completed, settled, settling, handleSettle])

  // ── 渲染 ──────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-red-500 font-medium text-center">{error}</p>
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">返回</button>
    </div>
  )

  if (!ad) return null

  const countdownPct = totalSecs > 0 ? ((totalSecs - remainSecs) / totalSecs) * 100 : 100
  const circumference = 2 * Math.PI * 20 // r=20

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* bg blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-20 w-72 h-72 bg-purple-300/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            返回
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">广告任务</span>
          </div>
          {/* 倒计时圆环 */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" width="40" height="40" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                stroke={completed ? "#22c55e" : "#3b82f6"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - countdownPct / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <span className={`text-[11px] font-bold relative z-10 ${completed ? "text-green-600" : "text-blue-600"}`}>
              {completed ? "✓" : remainSecs}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Ad Info */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: "linear-gradient(135deg,rgba(255,255,255,0.92) 0%,rgba(239,246,255,0.88) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 8px 32px rgba(59,130,246,0.1)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">广告品牌</p>
              <h1 className="text-xl font-bold text-slate-800">{ad.brand}</h1>
              <p className="text-sm text-slate-500 mt-1">{ad.type} · {ad.duration}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-0.5">完成奖励</p>
              <p className="text-2xl font-bold text-emerald-600">+¥{ad.reward}</p>
              <div className="flex items-center gap-1 justify-end mt-1">
                <Clock size={11} className="text-slate-400" />
                <span className="text-xs text-slate-400">
                  {completed ? "已完成" : countdownStarted ? `剩余 ${remainSecs}s` : `观看 ${totalSecs}s`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: "#0f172a",
            boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
          }}
        >
          {ad.videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={ad.videoUrl}
                className="w-full aspect-video object-contain bg-black"
                muted={muted}
                playsInline
                onPlay={handlePlay}
                onPause={() => setPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
              />

              {/* Controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                {/* Video progress */}
                <div className="w-full h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const v = videoRef.current
                      if (!v) return
                      playing ? v.pause() : v.play()
                    }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  >
                    {playing
                      ? <Pause size={16} />
                      : <Play size={16} className="ml-0.5" />
                    }
                  </button>
                  <button
                    onClick={() => setMuted(!muted)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  >
                    {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                </div>
              </div>

              {/* 未开始播放时的遮罩 */}
              {!playing && !completed && !countdownStarted && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer"
                  style={{ background: "rgba(15,23,42,0.5)" }}
                  onClick={() => videoRef.current?.play()}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Play size={28} className="text-white ml-1" />
                  </div>
                  <p className="text-white/70 text-sm">点击播放，观看 {totalSecs}s 获得 ¥{ad.reward}</p>
                </div>
              )}
            </>
          ) : (
            /* 无视频 — 倒计时模拟 */
            <div className="aspect-video flex flex-col items-center justify-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="-rotate-90 w-24 h-24" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle
                    cx="48" cy="48" r="40" fill="none"
                    stroke={completed ? "#22c55e" : "#60a5fa"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - countdownPct / 100)}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {completed ? "✓" : remainSecs}
                  </span>
                </div>
              </div>
              <p className="text-white/60 text-sm">
                {completed ? "观看完成！" : countdownStarted ? `还剩 ${remainSecs} 秒` : "该广告暂无视频素材"}
              </p>
              {!countdownStarted && (
                <button
                  onClick={startCountdown}
                  className="px-6 py-2.5 rounded-full bg-blue-500/80 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                >
                  开始计时
                </button>
              )}
            </div>
          )}
        </div>

        {/* 状态区域 */}
        {settled ? (
          /* 结算成功 */
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: "linear-gradient(135deg,#22c55e 0%,#16a34a 100%)",
              boxShadow: "0 8px 32px rgba(34,197,94,0.4)",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Gift size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">奖励已到账！</h2>
            <p className="text-white/80 text-sm mb-1">¥{reward} 已存入您的钱包余额</p>
            <p className="text-white/50 text-xs mb-6">3 秒后自动返回广告广场...</p>
            <button
              onClick={() => router.push("/market/acquisition?mode=task")}
              className="px-8 py-3 rounded-full bg-white text-green-700 font-semibold text-sm hover:bg-white/90 transition-colors shadow-lg"
            >
              立即返回
            </button>
          </div>
        ) : settling ? (
          /* 结算中 */
          <div
            className="rounded-3xl p-6 text-center"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(239,246,255,0.85) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 8px 32px rgba(59,130,246,0.1)",
            }}
          >
            <Loader2 size={32} className="text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 font-medium">正在结算奖励...</p>
          </div>
        ) : settleError ? (
          /* 结算失败 */
          <div
            className="rounded-3xl p-6 text-center"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,241,242,0.85) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(239,68,68,0.2)",
              boxShadow: "0 8px 32px rgba(239,68,68,0.08)",
            }}
          >
            <p className="text-red-500 font-medium mb-3">{settleError}</p>
            <button
              onClick={handleSettle}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold hover:-translate-y-0.5 transition-all shadow-lg"
            >
              重新结算
            </button>
          </div>
        ) : completed ? (
          /* 等待自动结算 */
          <div
            className="rounded-3xl p-6 text-center"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(239,246,255,0.85) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 8px 32px rgba(59,130,246,0.1)",
            }}
          >
            <CheckCircle size={36} className="text-blue-500 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">观看完成，正在自动结算...</p>
          </div>
        ) : (
          /* 观看提示 */
          <div
            className="rounded-3xl p-4 text-center"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.88) 0%,rgba(239,246,255,0.82) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 4px 16px rgba(59,130,246,0.06)",
            }}
          >
            <p className="text-sm text-slate-500">
              {ad.videoUrl
                ? `▶ 播放视频并等待 ${totalSecs} 秒倒计时结束，奖励自动到账`
                : `点击「开始计时」，等待 ${totalSecs} 秒后奖励自动到账`}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
