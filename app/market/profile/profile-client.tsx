"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User, ShieldCheck, Wallet, ArrowLeft, ChevronRight,
  PlaySquare, Users, Building2, CreditCard, PlusCircle,
  Settings, Bell, MessageSquare, Info, LogOut, BarChart3,
  Award, Shield, Download, Cpu, Key, Eye, EyeOff, Sparkles,
  TrendingUp, Star, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginPrompt } from "@/components/market/login-prompt"
import type { UserMarketProfile } from "@/lib/market/acquisition-types"
import { t } from "@/lib/market/i18n"
const isIntl = (process.env.NEXT_PUBLIC_SITE_REGION || "cn").toLowerCase() !== "cn"

export function ProfileClient() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserMarketProfile | null>(null)
  const [scaffoldProjects, setScaffoldProjects] = useState<any[]>([])
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [storedUser, setStoredUser] = useState<{ email?: string; nickname?: string } | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  // 充值/提现 modal
  const [walletModal, setWalletModal] = useState<"recharge" | "withdraw" | null>(null)
  const [walletAmount, setWalletAmount] = useState("")
  const [walletAccount, setWalletAccount] = useState("")
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletMsg, setWalletMsg] = useState("")
  // 国际版支付方式
  const isIntl = (process.env.NEXT_PUBLIC_SITE_REGION || "cn").toLowerCase() !== "cn"

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/market/admin/acquisition", { credentials: "include" })
      const json = await res.json()
      if (json.success) {
        setProfile(json.data.profile)
        setScaffoldProjects(json.data.scaffoldProjects || [])
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    try {
      const s = localStorage.getItem("market_user")
      if (s) setStoredUser(JSON.parse(s))
    } catch {}
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const ensureLoggedIn = useCallback(() => {
    if (!profile) { setIsLoginPromptOpen(true); return false }
    return true
  }, [profile])

  const handleFullAuth = async () => {
    if (!profile) return
    try {
      await fetch("/api/market/admin/acquisition", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_verification", type: "full" }),
      })
      fetchProfile()
    } catch {}
  }

  const handleGetPassword = async () => {
    if (!ensureLoggedIn()) return
    setLoadingPassword(true)
    setPassword("")
    setShowPasswordModal(true)
    try {
      const res = await fetch("/api/profile/get-password", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (data.ok) setPassword(data.password)
      else setShowPasswordModal(false)
    } catch { setShowPasswordModal(false) }
    finally { setLoadingPassword(false) }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" })
      router.push("/login")
    } catch {}
  }

  const openWallet = (type: "recharge" | "withdraw") => {
    if (!ensureLoggedIn()) return
    setWalletAmount("")
    setWalletAccount("")
    setWalletMsg("")
    setWalletModal(type)
  }

  const handleWalletSubmit = async () => {
    if (!walletAmount || parseFloat(walletAmount) <= 0) {
      setWalletMsg("请输入有效金额")
      return
    }
    if (walletModal === "withdraw" && !walletAccount.trim()) {
      setWalletMsg("请填写提现账号")
      return
    }
    setWalletLoading(true)
    setWalletMsg("")
    try {
      if (walletModal === "recharge" && isIntl) {
        // 国际版：跳转 Stripe Checkout
        const res = await fetch("/api/payment/stripe/checkout", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: parseFloat(walletAmount) }),
        })
        const json = await res.json()
        if (json.ok && json.url) {
          window.location.href = json.url
          return
        }
        setWalletMsg(`❌ ${json.message || "创建支付失败"}`)
        return
      }

      const url = walletModal === "recharge" ? "/api/wallet/recharge" : "/api/wallet/withdraw"
      const body: any = { amount: walletAmount }
      if (walletModal === "withdraw") body.accountInfo = walletAccount
      const res = await fetch(url, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.ok) {
        setWalletMsg(walletModal === "recharge" ? `✅ 充值成功，余额已更新` : `✅ 提现申请已提交`)
        fetchProfile()
        setTimeout(() => setWalletModal(null), 1500)
      } else {
        setWalletMsg(`❌ ${json.message || "操作失败"}`)
      }
    } catch {
      setWalletMsg("❌ 网络错误，请重试")
    } finally {
      setWalletLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500">加载中...</p>
      </div>
    </div>
  )

  const displayName = storedUser?.email || profile?.email || profile?.nickname || "未设置邮箱"
  const avatarLetter = displayName[0]?.toUpperCase() || "U"
  const isInfluencer = profile?.isInfluencerVerified
  const isMerchant = profile?.isMerchantVerified

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            {t("back")}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">{t("profile_title")}</span>
          </div>
          <button onClick={() => router.push("/market/profile/edit")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors">
            <Settings size={16} />
            {t("edit")}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 pb-16">

        {/* ── Hero: Avatar + Wallet (two-col on md) ── */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">

          {/* Avatar card */}
          <div
            className="md:col-span-2 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239,246,255,0.85) 60%, rgba(243,232,255,0.9) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 8px 32px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            {/* decorative ring */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-blue-400/10" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-purple-400/10" />

            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 blur-lg opacity-40 scale-110" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                {avatarLetter}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow">
                <ShieldCheck size={11} className="text-white" />
              </div>
            </div>

            <div className="text-center relative z-10">
              <p className="font-bold text-slate-800 text-sm leading-tight break-all">{displayName}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {profile?.id?.slice(0, 12) || "---"}…</p>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 relative z-10">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                isInfluencer
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}>
                {isInfluencer ? <Star size={9} className="fill-current" /> : null}
                {isInfluencer ? (profile?.isRealInfluencer ? t("top_influencer") : t("certified_influencer")) : t("uncertified_influencer")}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                isMerchant
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}>
                {isMerchant ? <Star size={9} className="fill-current" /> : null}
                {isMerchant ? (profile?.isRealMerchant ? t("top_merchant") : t("certified_merchant")) : t("uncertified_merchant")}
              </span>
            </div>
          </div>

          {/* Wallet card */}
          <div
            className="md:col-span-3 rounded-3xl p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 45%, #7c3aed 100%)",
              boxShadow: "0 8px 32px rgba(59,130,246,0.35), 0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {/* decorative */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute top-4 right-20 w-12 h-12 rounded-full bg-white/8" />

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={15} className="text-white/60" />
                <span className="text-white/60 text-xs font-medium">{t("my_wallet")}</span>
              </div>

              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-white/50 text-xs mb-1">{t("account_balance")}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white/70 text-lg font-medium">¥</span>
                    <span className="text-white text-4xl font-bold tracking-tight">{profile?.balance || "0.00"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs mb-1">{t("total_earnings")}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp size={14} className="text-green-300" />
                    <span className="text-white/90 text-xl font-semibold">¥ {profile?.totalEarnings || "0.00"}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => openWallet("recharge")}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-medium transition-all hover:-translate-y-0.5"
                >
                  <PlusCircle size={15} /> {t("recharge")}
                </button>
                <button
                  onClick={() => router.push("/market/membership")}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-medium transition-all hover:-translate-y-0.5"
                >
                  <Zap size={15} /> {t("ai_recharge")}
                </button>
                <button
                  onClick={() => openWallet("withdraw")}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white text-indigo-700 hover:bg-white/90 text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg"
                >
                  <CreditCard size={15} /> {t("withdraw")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-col grid: Business + Account ── */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">

          {/* My Business */}
          <GlassSection title={t("my_business")} icon={<PlaySquare size={14} />}>
            <NavItem href="/market/invite" icon={<Users size={16} />} iconColor="text-emerald-600" iconBg="bg-emerald-50"
              label={isIntl ? "Invite Friends" : "邀请好友"} sub={isIntl ? "Share & earn discount codes" : "分享链接，获得折扣码奖励"} />
            <NavItem href="/market/invite" icon={<Users size={16} />} iconColor="text-blue-600" iconBg="bg-blue-50"
              label={t("my_tasks")} sub={t("tasks_completed", { n: profile?.adViewsCount || 0 })} />
            <NavItem href="/market/my-tasks" icon={<PlaySquare size={16} />} iconColor="text-orange-500" iconBg="bg-orange-50"
              label={t("my_cooperation")} sub={t("cooperation_sub")} />
            <NavItem href="/market/acquisition?mode=merchant" icon={<Building2 size={16} />} iconColor="text-purple-600" iconBg="bg-purple-50"
              label={t("ad_leads")} sub={t("ad_leads_sub")} last />
          </GlassSection>

          <GlassSection title={t("account_center")} icon={<Shield size={14} />}>
            <NavItem href="/market/transactions" icon={<BarChart3 size={16} />} iconColor="text-blue-600" iconBg="bg-blue-50"
              label={t("bill_detail")} sub={t("bill_sub")} />
            <NavItem href="/market/acquisition?mode=task" icon={<Shield size={16} />} iconColor="text-indigo-600" iconBg="bg-indigo-50"
              label={t("identity_verify")} sub={t("identity_sub")} />
            <NavItem icon={<Award size={16} />} iconColor="text-purple-600" iconBg="bg-purple-50"
              label={t("influencer_level")} sub={t("influencer_level_sub")} last />
          </GlassSection>
        </div>

        {/* ── Settings (full width) ── */}
        <GlassSection title={t("more_settings")} icon={<Settings size={14} />} className="mb-4">
          <div className="grid sm:grid-cols-2">
            <Link href="/market/profile/edit">
              <NavItem icon={<User size={16} />} iconColor="text-slate-600" iconBg="bg-slate-100" label={t("edit_profile")} sub={t("edit_profile_sub")} />
            </Link>
            <div onClick={handleGetPassword}>
              <NavItem icon={<Key size={16} />} iconColor="text-slate-600" iconBg="bg-slate-100" label={t("view_password")} sub={t("view_password_sub")} />
            </div>
            <NavItem icon={<Bell size={16} />} iconColor="text-slate-600" iconBg="bg-slate-100" label={t("notifications")} sub={t("notifications_sub")} />
            <NavItem icon={<MessageSquare size={16} />} iconColor="text-slate-600" iconBg="bg-slate-100" label={t("support")} sub={t("support_sub")} />
            <NavItem icon={<Info size={16} />} iconColor="text-slate-600" iconBg="bg-slate-100" label={t("about")} sub="v1.2.4" last />
            <div onClick={handleLogout} className="sm:col-start-2">
              <NavItem icon={<LogOut size={16} />} iconColor="text-red-500" iconBg="bg-red-50"
                label={t("logout")} sub={t("logout_sub")} labelClass="text-red-500" last />
            </div>
          </div>
        </GlassSection>

        {/* ── Generated Projects ── */}
        {scaffoldProjects.length > 0 && (
          <GlassSection title="生成的项目" icon={<Cpu size={14} />} className="mb-4">
            <div className="grid sm:grid-cols-2 gap-2 p-3">
              {scaffoldProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-white/40 hover:bg-blue-50/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Cpu size={14} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-slate-800 truncate">{proj.projectName}</p>
                      <p className="text-[10px] text-slate-400">{proj.template}</p>
                    </div>
                  </div>
                  <a
                    href={proj.zipUrl}
                    download
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700 transition-colors flex-shrink-0 ml-2"
                  >
                    <Download size={11} /> 下载
                  </a>
                </div>
              ))}
            </div>
          </GlassSection>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 mt-2">
          <p>© 2026 mornbusiness · AI Business Operating System</p>
          <button
            className="mt-3 text-[10px] text-slate-300 opacity-20 hover:opacity-50 transition-opacity"
            onClick={handleFullAuth}
          >
            [DEBUG] 一键全能认证
          </button>
        </div>
      </main>

      <LoginPrompt isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />

      {/* 充值 / 提现 Modal */}
      {walletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.96) 0%,rgba(239,246,255,0.92) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.7)",
            }}
          >
            {/* header */}
            <div className={`px-6 py-5 relative overflow-hidden ${walletModal === "recharge" ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-gradient-to-r from-indigo-500 to-purple-600"}`}>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-lg font-bold text-white">{walletModal === "recharge" ? "账户充值" : "申请提现"}</h3>
                  <p className="text-white/60 text-xs mt-0.5">
                    {walletModal === "recharge" ? "模拟充值，直接到账" : `当前余额 ¥${profile?.balance || "0.00"}`}
                  </p>
                </div>
                <button onClick={() => setWalletModal(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                  ✕
                </button>
              </div>
            </div>

            {/* body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {walletModal === "recharge" ? "充值金额（元）" : "提现金额（元）"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¥</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="请输入金额"
                    value={walletAmount}
                    onChange={e => setWalletAmount(e.target.value)}
                    className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 font-semibold text-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  />
                </div>
                {/* 快捷金额 */}
                <div className="flex gap-2 pt-1">
                  {["10", "50", "100", "500"].map(v => (
                    <button key={v} onClick={() => setWalletAmount(v)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${walletAmount === v ? "bg-blue-500 text-white border-blue-500" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"}`}>
                      ¥{v}
                    </button>
                  ))}
                </div>
              </div>

              {walletModal === "withdraw" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">提现账号（支付宝/微信）</label>
                  <input
                    type="text"
                    placeholder="请输入支付宝或微信账号"
                    value={walletAccount}
                    onChange={e => setWalletAccount(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  />
                </div>
              )}

              {walletMsg && (
                <p className={`text-sm text-center font-medium ${walletMsg.startsWith("✅") ? "text-emerald-600" : "text-red-500"}`}>
                  {walletMsg}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setWalletModal(null)} className="flex-1 h-11 rounded-full border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors">
                  取消
                </button>
                <button
                  onClick={handleWalletSubmit}
                  disabled={walletLoading}
                  className={`flex-1 h-11 rounded-full text-white text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${walletModal === "recharge" ? "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/30" : "bg-gradient-to-r from-indigo-500 to-purple-600 shadow-purple-500/30"}`}
                >
                  {walletLoading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : walletModal === "recharge" ? <><PlusCircle size={15} /> 确认充值</> : <><CreditCard size={15} /> 确认提现</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div
            className="w-full max-w-sm rounded-3xl p-6"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.9) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 25px 50px rgba(59,130,246,0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Key size={14} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-800">登录密码</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 ml-10">请妥善保管，不要泄露给他人</p>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4">
              {loadingPassword ? (
                <span className="text-sm text-slate-400 animate-pulse flex-1">获取中...</span>
              ) : (
                <>
                  <span className="flex-1 font-mono text-sm tracking-widest text-slate-800">
                    {showPassword ? password : "••••••••"}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setShowPasswordModal(false)}
              className="w-full h-11 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────

function GlassSection({
  title, icon, children, className = ""
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(239,246,255,0.82) 60%, rgba(243,232,255,0.88) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow: "0 4px 24px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <span className="text-blue-500">{icon}</span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</span>
      </div>
      <div className="divide-y divide-slate-100/80">
        {children}
      </div>
    </div>
  )
}

function NavItem({
  href, icon, iconColor, iconBg, label, sub, last = false, labelClass = ""
}: {
  href?: string
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  label: string
  sub?: string
  last?: boolean
  labelClass?: string
}) {
  const inner = (
    <div className={`flex items-center justify-between px-4 py-3 hover:bg-blue-50/60 active:bg-blue-100/60 transition-colors cursor-pointer group ${last ? "" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm font-medium text-slate-800 ${labelClass}`}>{label}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
