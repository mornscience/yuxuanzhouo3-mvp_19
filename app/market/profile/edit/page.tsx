"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, User, Phone, Lock, Eye, EyeOff, Sparkles, CheckCircle } from "lucide-react"
import { t } from "@/lib/market/i18n"

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const [nickname, setNickname] = useState("")
  const [phone, setPhone] = useState("")
  const [initialNickname, setInitialNickname] = useState("")
  const [initialPhone, setInitialPhone] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const fetchUserInfo = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (res.status === 401) { router.push("/login"); return }
      const json = await res.json()
      if (json.ok) {
        const nick = json.data.profile?.nickname || ""
        const ph = json.data.profile?.phone || ""
        setNickname(nick)
        setPhone(ph)
        setInitialNickname(nick)
        setInitialPhone(ph)
      }
    } catch {}
    finally { setLoading(false) }
  }, [router])

  useEffect(() => { fetchUserInfo() }, [fetchUserInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)

    // 有初始值、或当前值非空，都算"基础资料有内容需要保存"
    const hasBasic = nickname !== initialNickname || phone !== initialPhone
    const hasPassword = !!(oldPassword && newPassword)

    if (!hasBasic && !hasPassword) { setMsg({ type: "err", text: "没有检测到任何修改" }); return }
    if (newPassword && newPassword !== confirmPassword) { setMsg({ type: "err", text: "新密码与确认密码不匹配" }); return }
    if (newPassword && newPassword.length < 6) { setMsg({ type: "err", text: "新密码至少 6 位" }); return }

    setSaving(true)
    try {
      const promises: Promise<any>[] = []
      if (hasBasic) {
        promises.push(
          fetch("/api/profile/update-base", {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname: nickname.trim(), phone: phone.trim() }),
          }).then(r => r.json())
        )
      }
      if (hasPassword) {
        promises.push(
          fetch("/api/profile/update-password", {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldPassword, newPassword }),
          }).then(r => r.json())
        )
      }
      const results = await Promise.all(promises)
      const failed = results.find(r => !r.ok)
      if (failed) {
        setMsg({ type: "err", text: failed.message || "更新失败" })
      } else {
        setMsg({ type: "ok", text: "资料更新成功，即将返回..." })
        setOldPassword(""); setNewPassword(""); setConfirmPassword("")
        setInitialNickname(nickname.trim())
        setInitialPhone(phone.trim())
        setTimeout(() => router.push("/market/profile"), 1500)
      }
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "网络错误" })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full h-12 px-4 rounded-xl border border-slate-200 bg-white/60 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
  const glassCard = {
    background: "linear-gradient(135deg,rgba(255,255,255,0.88) 0%,rgba(239,246,255,0.82) 60%,rgba(243,232,255,0.88) 100%)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.6)",
    boxShadow: "0 4px 24px rgba(59,130,246,0.08),inset 0 1px 0 rgba(255,255,255,0.8)",
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">{t("loading")}</p>
      </div>
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
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> {t("back")}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">{t("edit_profile_title")}</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* 提示 */}
        {msg && (
          <div className={`rounded-2xl px-4 py-3 flex items-center gap-2.5 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
            {msg.type === "ok" ? <CheckCircle size={16} /> : <span>⚠️</span>}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 基本信息 */}
          <div className="rounded-3xl overflow-hidden" style={glassCard}>
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <User size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{t("basic_info")}</span>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">昵称</label>
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="请输入昵称"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">手机号</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 修改密码 */}
          <div className="rounded-3xl overflow-hidden" style={glassCard}>
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Lock size={13} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{t("change_password")}</span>
              <span className="text-xs text-slate-400 ml-1">（不修改可留空）</span>
            </div>
            <div className="px-5 pb-5 space-y-4">
              {[
                { label: "旧密码", val: oldPassword, set: setOldPassword, show: showOld, toggle: () => setShowOld(v => !v) },
                { label: "新密码", val: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v), hint: "至少 6 位" },
                { label: "确认新密码", val: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
              ].map(({ label, val, set, show, toggle, hint }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {label}{hint && <span className="normal-case font-normal ml-1 text-slate-300">({hint})</span>}
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={show ? "text" : "password"}
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder={`请输入${label}`}
                      className={`${inputCls} pl-10 pr-11`}
                    />
                    <button type="button" onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.push("/market/profile")}
              className="flex-1 h-12 rounded-full border border-slate-200 bg-white/70 text-slate-500 text-sm font-medium hover:bg-white transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("saving")}</>
                : <><Save size={15} /> {t("save_changes")}</>
              }
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
