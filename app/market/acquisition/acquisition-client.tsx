"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Users, Building2, Landmark, PlaySquare, Mail, Search, Plus,
  MoreHorizontal, ChevronLeft, Filter, DollarSign, Lock, X,
  Download, Clock, FileText, Cpu, Globe, Database, CheckCircle,
  Copy, Send, Calendar, ArrowRight, Check, User, Settings,
  ShieldCheck, Wallet, Bell, Award, BarChart3, TrendingUp,
  CreditCard, ExternalLink, RefreshCw, Loader2, Target, Network,
  Eye, EyeOff, Handshake,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { LoginPrompt } from "@/components/market/login-prompt"
import { UserAvatarDropdown } from "@/components/market/user-avatar-dropdown"
import { NotificationCenter } from "./notification-center"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { t, isIntl } from "@/lib/market/i18n"
import type {
  AcquisitionBlogger,
  AcquisitionB2BLead,
  AcquisitionVCLead,
  AcquisitionAd,
  AcquisitionBootstrapData,
  UserMarketProfile,
  AdParticipation,
} from "@/lib/market/acquisition-types"

type ViewMode = "task" | "influencer" | "merchant"

// ==========================================
// Helper: Status badge
// ==========================================
function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
  const successStatus = ["已签约", "已转化", "已投资", "投放中", "已完成", "已合作"]
  const pendingStatus = ["谈判中", "跟进中", "合同拟定", "进行中", "待审核", "已联系", "已发邮件"]
  
  if (successStatus.includes(status)) variant = "default"
  else if (pendingStatus.includes(status)) variant = "outline"
  return <Badge variant={variant}><span>{status}</span></Badge>
}

// ==========================================
// Generic modal wrapper - Blue-tech glassmorphism style
// ==========================================
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {children}
    </div>
  )
}

// ==========================================
// Component: Verification Status
// ==========================================
function VerificationCard({ profile, onVerify }: { profile?: UserMarketProfile; onVerify: (type: "realName" | "influencer" | "merchant") => void }) {
  if (!profile) return null
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* 实名认证卡片已注释掉，将来再启用
      <Card className={`${profile.isRealNameVerified ? 'bg-green-50/50 border-green-100' : 'bg-orange-50/50 border-orange-100'}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${profile.isRealNameVerified ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">实名认证</p>
              <p className="text-xs text-muted-foreground">{profile.isRealNameVerified ? '已认证(可提现)' : '未认证(限额提现)'}</p>
            </div>
          </div>
          {!profile.isRealNameVerified && <Button size="sm" variant="outline" onClick={() => onVerify('realName')}>去认证</Button>}
        </CardContent>
      </Card>
      */}
      
      {/* Influencer Verification Card */}
      <div 
        className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        style={{
          background: profile.isInfluencerVerified 
            ? 'linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(219,234,254,0.9) 100%)'
            : 'linear-gradient(135deg, rgba(248,250,252,0.95) 0%, rgba(241,245,249,0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: profile.isInfluencerVerified ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(203,213,225,0.5)',
          boxShadow: profile.isInfluencerVerified ? '0 8px 32px rgba(59,130,246,0.15)' : '0 4px 16px rgba(0,0,0,0.05)'
        }}
      >
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${profile.isInfluencerVerified ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <Users size={22} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">{t("influencer_verify")}</p>
              <p className="text-sm text-slate-500 mt-0.5">{profile.isInfluencerVerified ? (profile.isRealInfluencer ? 'Gold Influencer' : t("influencer_verified")) : 'Not Verified'}</p>
            </div>
          </div>
          {!profile.isInfluencerVerified && (
            <button 
              onClick={() => onVerify('influencer')}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              Verify
            </button>
          )}
          {profile.isInfluencerVerified && (
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Check size={16} className="text-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* Merchant Verification Card */}
      <div 
        className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        style={{
          background: profile.isMerchantVerified 
            ? 'linear-gradient(135deg, rgba(243,232,255,0.95) 0%, rgba(233,213,255,0.9) 100%)'
            : 'linear-gradient(135deg, rgba(248,250,252,0.95) 0%, rgba(241,245,249,0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: profile.isMerchantVerified ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(203,213,225,0.5)',
          boxShadow: profile.isMerchantVerified ? '0 8px 32px rgba(168,85,247,0.15)' : '0 4px 16px rgba(0,0,0,0.05)'
        }}
      >
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${profile.isMerchantVerified ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">{t("merchant_verify")}</p>
              <p className={`text-sm mt-0.5 ${profile.isMerchantVerified ? 'text-green-600' : profile.merchant_verify_status === 'rejected' ? 'text-red-600' : 'text-slate-500'}`}>
                {profile.isMerchantVerified 
                  ? (profile.isRealMerchant ? 'Gold Merchant' : t("merchant_verified")) 
                  : profile.merchant_verify_status === 'pending' 
                    ? 'Pending Review'
                    : profile.merchant_verify_status === 'rejected'
                      ? 'Rejected'
                      : 'Not Verified'
                }
              </p>
              {profile.merchant_verify_status === 'rejected' && profile.merchant_reject_reason && (
                <p className="text-xs text-red-500 mt-1 line-clamp-2 max-w-[200px]" title={profile.merchant_reject_reason}>
                  Reason: {profile.merchant_reject_reason}
                </p>
              )}
            </div>
          </div>
          {!profile.isMerchantVerified && profile.merchant_verify_status !== 'rejected' && (
            <button 
              onClick={() => onVerify('merchant')}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:shadow-md transition-all duration-300"
            >
              Verify
            </button>
          )}
          {profile.merchant_verify_status === 'rejected' && (
            <button 
              onClick={() => onVerify('merchant')}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-red-200 text-red-600 hover:border-red-300 hover:shadow-md transition-all duration-300"
            >
              Reapply
            </button>
          )}
          {profile.isMerchantVerified && (
            <button 
              onClick={() => window.location.href = '/market/acquisition/merchant-verify-detail'}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all duration-300 flex items-center gap-2"
            >
              <Building2 size={14} />
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// View: Task Mode (Ad-to-Earn)
// ==========================================
function TaskModeView({ ads, profile, participations, onParticipate, onComplete }: { 
  ads: AcquisitionAd[], 
  profile?: UserMarketProfile, 
  participations: AdParticipation[],
  onParticipate: (ad: AcquisitionAd) => void,
  onComplete: (participation: AdParticipation) => void
}) {
  const router = useRouter()
  // 已完成的任务
  const completedParticipations = participations.filter(p => p.status === "已完成")
  // 已完成的广告 id 集合，用于广告广场禁用判断
  const completedAdIds = new Set(completedParticipations.map(p => p.adId))
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div 
          className="relative rounded-2xl p-5 flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(219,234,254,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59,130,246,0.2)',
            boxShadow: '0 8px 32px rgba(59,130,246,0.1)'
          }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center">
            <Wallet size={22} />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">{t("current_balance")}</div>
            <div className="text-2xl font-bold text-slate-800">¥{profile?.balance || "0.00"}</div>
          </div>
        </div>

        {/* Earnings Card */}
        <div 
          className="relative rounded-2xl p-5 flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(240,253,244,0.95) 0%, rgba(220,252,231,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(34,197,94,0.2)',
            boxShadow: '0 8px 32px rgba(34,197,94,0.1)'
          }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center">
            <Award size={22} />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">{t("total_earnings_task")}</div>
            <div className="text-2xl font-bold text-slate-800">¥{profile?.totalEarnings || "0.00"}</div>
          </div>
        </div>

        {/* Tasks Card */}
        <div 
          className="relative rounded-2xl p-5 flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(243,232,255,0.95) 0%, rgba(233,213,255,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(168,85,247,0.2)',
            boxShadow: '0 8px 32px rgba(168,85,247,0.1)'
          }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-3 text-white shadow-lg shadow-purple-500/25 flex items-center justify-center">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">{t("tasks_done")}</div>
            <div className="text-2xl font-bold text-slate-800">{completedParticipations.length}</div>
          </div>
        </div>

        {/* Progress Card */}
        <div 
          className="relative rounded-2xl p-5 flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(255,251,235,0.95) 0%, rgba(254,243,199,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(245,158,11,0.2)',
            boxShadow: '0 8px 32px rgba(245,158,11,0.1)'
          }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-3 text-white shadow-lg shadow-orange-500/25 flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">{t("real_user_progress")}</div>
            <div className="text-2xl font-bold text-slate-800">{profile?.adViewsCount || 0}/3</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ad Task Square */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold flex items-center text-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-3 shadow-md">
              <PlaySquare className="h-4 w-4 text-white" />
            </div>
            {t("ad_task_square")}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {ads.filter(ad => ad.status === "投放中").map(ad => {
              const isDone = completedAdIds.has(ad.id)
              return (
                <div 
                  key={ad.id}
                  className={`group rounded-2xl p-5 transition-all duration-300 ${isDone ? 'opacity-60' : 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'}`}
                  style={{
                    background: isDone
                      ? 'linear-gradient(135deg, rgba(241,245,249,0.95) 0%, rgba(226,232,240,0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: isDone ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(203,213,225,0.4)',
                    boxShadow: isDone ? 'none' : '0 4px 16px rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shadow-inner transition-all duration-300 ${
                        isDone
                          ? 'bg-slate-200 text-slate-400'
                          : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 group-hover:from-blue-100 group-hover:to-cyan-100 group-hover:text-blue-600'
                      }`}>
                        {isDone ? <CheckCircle size={28} className="text-slate-400" /> : ad.brand[0]}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-800">{ad.brand}</div>
                        <div className="flex items-center space-x-3 text-sm text-slate-500 mt-1">
                          <span className="flex items-center"><Clock size={14} className="mr-1" /> {ad.duration}</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">{ad.type}</span>
                        </div>
                        {isDone && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-emerald-600 font-medium">
                            <CheckCircle size={11} /> {t("task_reward_received")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold mb-2 ${isDone ? 'text-slate-400' : 'text-emerald-600'}`}>
                        +{ad.reward}
                      </div>
                      {isDone ? (
                        <div className="px-4 py-2 rounded-full text-sm font-medium bg-slate-200 text-slate-400 cursor-not-allowed select-none">
                          {t("watched")}
                        </div>
                      ) : (
                        <button 
                          onClick={() => router.push(`/ad/play/${ad.id}`)}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
                        >
                          {t("watch_now")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* 已完成的任务 */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center text-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mr-3 shadow-md">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            {t("tasks_done_section")}
          </h3>
          <div 
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(219,234,254,0.9) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(59,130,246,0.15)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.08)'
            }}
          >
            {completedParticipations.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">{t("task_done_placeholder")}</p>
              </div>
            ) : (
              <div className="divide-y divide-blue-100/60">
                {completedParticipations
                  .filter(p => ads.some(a => a.id === p.adId))
                  .map(p => {
                  const ad = ads.find(a => a.id === p.adId)!
                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={16} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{ad?.brand}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{ad?.duration}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500">{ad?.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-blue-600">+¥{p.rewardEarned}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Withdraw Button */}
          <button 
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full 
              bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 
              hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 
              text-white font-semibold text-sm
              shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 
              transition-all duration-300 hover:-translate-y-0.5"
          >
            <CreditCard className="h-4 w-4" /> 
            {t("withdraw_apply")}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// View: Influencer Mode (Blogger Profile & Pool)
// ==========================================
function InfluencerModeView({ profile, bloggerProfile, bloggers, allBloggers, subMode, onSetSubMode, onUpdateProfile, onAddBlogger, onDeleteBlogger, onVerify }: {
  profile?: UserMarketProfile,
  bloggerProfile?: AcquisitionBlogger,
  bloggers: AcquisitionBlogger[],
  allBloggers: AcquisitionBlogger[],
  subMode: 'pool' | 'personal',
  onSetSubMode: (mode: 'pool' | 'personal') => void,
  onUpdateProfile: (blogger: AcquisitionBlogger) => void,
  onAddBlogger: () => void,
  onDeleteBlogger: (id: string) => void,
  onVerify: (type: "realName" | "influencer" | "merchant") => void
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const pageSize = 10
  const router = useRouter()

  const handleApplyCooperation = async (blogger: AcquisitionBlogger) => {
    const msg = prompt(`Apply to cooperate with "${blogger.name}" (optional message):`)
    if (msg === null) return
    try {
      const res = await fetch("/api/market/blogger-cooperation", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          bloggerId: blogger.id,
          bloggerName: blogger.name,
          platform: blogger.platform,
          email: blogger.email,
          cost: blogger.cost,
          commission: blogger.commission,
          message: msg,
          bloggerOwnerId: blogger.userId,
          applicantName: profile?.nickname || "",
          applicantEmail: profile?.email || "",
        })
      })
      const json = await res.json()
      if (json.ok) alert(json.message || "Application sent! Check 'Blogger Cooperation → Sent Applications'")
      else alert(json.message || "Application failed")
    } catch { alert("Application failed, please try again") }
  }

  // 博主池页面数据过滤 (Moved to top to follow Hook rules)
  const filteredBloggers = useMemo(() => {
    if (!searchQuery.trim()) return allBloggers
    const query = searchQuery.toLowerCase()
    return allBloggers.filter(b => 
      b.name.toLowerCase().includes(query) || 
      b.platform.toLowerCase().includes(query) || 
      b.email.toLowerCase().includes(query)
    )
  }, [allBloggers, searchQuery])

  const totalPages = Math.ceil(filteredBloggers.length / pageSize)
  const paginatedBloggers = filteredBloggers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // 当搜索内容改变时，重置页码 (Moved to top to follow Hook rules)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const getWebMailUrl = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase()
    const subject = encodeURIComponent(`来自 mornbusiness 的合作邀请 - 洽谈`)
    const encodedEmail = encodeURIComponent(email)

    const mailMap: Record<string, string> = {
      'qq.com': 'https://mail.qq.com/',
      'foxmail.com': 'https://mail.qq.com/',
      '163.com': 'https://mail.163.com/',
      '126.com': 'https://mail.126.com/',
      'gmail.com': `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedEmail}&su=${subject}`,
      'outlook.com': `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedEmail}&subject=${subject}`,
      'hotmail.com': `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedEmail}&subject=${subject}`,
      'yahoo.com': `https://compose.mail.yahoo.com/?to=${encodedEmail}&subj=${subject}`,
    }

    return mailMap[domain] || `mailto:${email}?subject=${subject}`
  }

  // 个人管理页面 (Figure 1)
  if (subMode === 'personal') {
    // 如果未认证达人，显示认证提示
    if (profile && !profile.isInfluencerVerified) {
      return (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h3 className="text-base sm:text-lg font-bold flex items-center"><Users className="mr-2 h-5 w-5 text-blue-600" /> {t("personal_influencer_page")}</h3>
            <Button variant="outline" size="sm" onClick={() => onSetSubMode('pool')}>
              <Globe className="mr-2 h-4 w-4" /> {t("enter_blogger_pool")}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
              <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><Users size={20} /></div>
              <div>
                <div className="text-sm text-muted-foreground">{t("influencer_status")}</div>
                <div className="font-bold">{t("uncertified_influencer_label")}</div>
              </div>
            </div>
            <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
              <div className="rounded-lg border bg-green-50 p-3 text-green-600"><DollarSign size={20} /></div>
              <div>
                <div className="text-sm text-muted-foreground">{t("total_order_earnings")}</div>
                <div className="text-2xl font-bold">¥0</div>
              </div>
            </div>
            <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
              <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><Wallet size={20} /></div>
              <div>
                <div className="text-sm text-muted-foreground">{t("current_balance")}</div>
                <div className="text-2xl font-bold">¥{profile?.balance || "0.00"}</div>
              </div>
            </div>
            <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
              <div className="rounded-lg border bg-purple-50 p-3 text-purple-600"><Award size={20} /></div>
              <div>
                <div className="text-sm text-muted-foreground">{t("coop_count")}</div>
                <div className="text-2xl font-bold">0</div>
              </div>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("unlock_influencer_title")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("unlock_influencer_desc")}
              </p>
              <Button size="lg" onClick={() => onVerify('influencer')} className="bg-blue-600 hover:bg-blue-700">
                <Award className="mr-2 h-5 w-5" /> {t("verify_influencer_now")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-bold flex items-center"><User className="mr-2 h-5 w-5 text-blue-600" /> {t("personal_influencer_page")}</h3>
          <Button variant="outline" size="sm" onClick={() => onSetSubMode('pool')}>
            <Globe className="mr-2 h-4 w-4" /> {t("enter_blogger_pool")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><Users size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">{t("influencer_status")}</div>
              <div className="font-bold text-sm">{!profile?.isInfluencerVerified ? t("uncertified_influencer_label") : profile?.isRealInfluencer ? '🔥 Verified Influencer' : t("influencer_verified")}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-green-50 p-3 text-green-600"><DollarSign size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">{t("total_order_earnings")}</div>
              <div className="text-2xl font-bold">¥{profile?.totalEarnings || "0"}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><Wallet size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">{t("current_balance")}</div>
              <div className="text-2xl font-bold">¥{profile?.balance || "0.00"}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-purple-50 p-3 text-purple-600"><Award size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">{t("coop_count")}</div>
              <div className="text-2xl font-bold">0</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold flex items-center"><Users className="mr-2 h-5 w-5 text-blue-600" /> {t("my_influencer_profile")}</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onAddBlogger}>
              <Plus className="mr-2 h-4 w-4" /> {t("add_blogger_account")}
            </Button>
          </div>
        </div>

        {/* Personal Blogger Table */}
        <div 
          className="rounded-2xl overflow-hidden overflow-x-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(224,234,255,0.8)',
            boxShadow: '0 8px 32px rgba(59,130,246,0.08)'
          }}
        >
          <Table>
            <TableHeader>
              <TableRow 
                className="border-b"
                style={{ 
                  background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%)',
                  borderBottom: '1px solid #e0eaff'
                }}
              >
                <TableHead className="font-bold text-blue-900 py-4">{t("influencer_name")}</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">{t("main_platform")}</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">{t("unit_price")}</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">{t("commission")}</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">{t("contact_email")}</TableHead>
                <TableHead className="text-right font-bold text-blue-900 py-4">{t("operation")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloggers.filter(b => b.status !== '已删除').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    {t("no_blogger_profile")}
                  </TableCell>
                </TableRow>
              ) : (
                bloggers.filter(b => b.status !== '已删除').map((blogger, index) => (
                  <TableRow 
                    key={blogger.id}
                    className="transition-all duration-200"
                    style={{
                      background: index % 2 === 0 ? '#f8fbff' : '#f0f7ff',
                      borderBottom: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e6f3ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? '#f8fbff' : '#f0f7ff';
                    }}
                  >
                    <TableCell className="font-semibold text-slate-800 py-4">{blogger.name}</TableCell>
                    <TableCell className="py-4">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          color: '#1e40af',
                          border: '1px solid rgba(59,130,246,0.2)'
                        }}
                      >
                        {blogger.platform}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 py-4">{blogger.cost}</TableCell>
                    <TableCell className="text-blue-600 font-bold py-4">{blogger.commission}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs py-4">{blogger.email}</TableCell>
                    <TableCell className="text-right py-4">
                      <button 
                        onClick={() => onUpdateProfile(blogger)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200 mr-2"
                      >
                        {t("update")}
                      </button>
                      <button 
                        onClick={() => onDeleteBlogger(blogger.id)}
                        className="text-red-500 hover:text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        {t("delete")}
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // 博主池页面 (New Pool View)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-bold flex items-center"><Globe className="mr-2 h-5 w-5 text-blue-600" /> {t("blogger_pool_title")}</h3>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => router.push('/market/blogger-cooperation')} className="border-blue-200 text-blue-600 hover:bg-blue-50">
            <Handshake className="mr-2 h-4 w-4" /> {t("blogger_coop")}
          </Button>
          <Button variant="default" onClick={() => onSetSubMode('personal')} className="bg-blue-600">
            <User className="mr-2 h-4 w-4" /> {t("blogger_mgmt")}
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder={t("search_blogger_placeholder")}
          className="pl-10 py-6 text-lg rounded-xl shadow-sm border-blue-100" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Glassmorphism Table Card */}
      <div 
        className="rounded-2xl overflow-hidden overflow-x-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(224,234,255,0.8)',
          boxShadow: '0 8px 32px rgba(59,130,246,0.08)'
        }}
      >
        <Table>
          <TableHeader>
            <TableRow 
              className="border-b"
              style={{ 
                background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%)',
                borderBottom: '1px solid #e0eaff'
              }}
            >
              <TableHead className="font-bold text-blue-900 py-4">{t("influencer_name")}</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">{t("main_platform")}</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">{t("unit_price")}</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">{t("commission")}</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">{t("contact_email")}</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">{t("status")}</TableHead>
              <TableHead className="text-right font-bold text-blue-900 py-4">{t("operation")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBloggers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-10 w-10 mb-2 opacity-20" />
                    <p>{t("no_blogger_data")}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedBloggers.map((blogger, index) => (
                <TableRow 
                  key={blogger.id} 
                  className="transition-all duration-200"
                  style={{
                    background: index % 2 === 0 ? '#f8fbff' : '#f0f7ff',
                    borderBottom: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e6f3ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? '#f8fbff' : '#f0f7ff';
                  }}
                >
                  <TableCell className="font-semibold text-slate-800 py-4">{blogger.name}</TableCell>
                  <TableCell className="py-4">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        color: '#1e40af',
                        border: '1px solid rgba(59,130,246,0.2)'
                      }}
                    >
                      {blogger.platform}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 py-4">{blogger.cost}</TableCell>
                  <TableCell className="text-blue-600 font-bold py-4">{blogger.commission}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs py-4">{blogger.email}</TableCell>
                  <TableCell className="py-4">
                    {blogger.status === '已删除' ? (
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                          color: '#dc2626',
                          border: '1px solid rgba(239,68,68,0.2)'
                        }}
                      >
                        已停用
                      </span>
                    ) : (
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                          color: '#059669',
                          border: '1px solid rgba(34,197,94,0.2)'
                        }}
                      >
                        {t("available")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    {blogger.status === '已删除' ? (
                      <span className="text-slate-400 text-sm cursor-not-allowed">{t("unavailable")}</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <a 
                          href={getWebMailUrl(blogger.email)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          {t("contact_discuss")}
                        </a>
                        {blogger.userId !== profile?.id && (
                          <button
                            onClick={() => handleApplyCooperation(blogger)}
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-200"
                          >
                            {t("apply_coop")}
                          </button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="py-4 border-t border-blue-50 bg-slate-50/30">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// View: Merchant Mode (B2B + VC)
// ==========================================
function MerchantModeView({ ads, b2bLeads, vcFollowLeads, vcPublishLeads, profile, onAddAd, onAddB2BFollow, onAddB2BPublish, onAddVCFollow, onAddVCPublish, onUpdateStatus, onVerify, onPublishLead, onPublishVCLead, onViewPublicPool, onViewApplications }: {
  ads: AcquisitionAd[],
  b2bLeads: AcquisitionB2BLead[],
  vcFollowLeads: AcquisitionVCLead[],
  vcPublishLeads: AcquisitionVCLead[],
  profile?: UserMarketProfile,
  onAddAd: () => void,
  onAddB2BFollow: () => void,
  onAddB2BPublish: () => void,
  onAddVCFollow: () => void,
  onAddVCPublish: () => void,
  onUpdateStatus: (type: 'ad' | 'b2b' | 'vc', item: any) => void,
  onVerify: (type: "realName" | "influencer" | "merchant") => void,
  onPublishLead: (lead: AcquisitionB2BLead, isPublic: boolean) => void,
  onPublishVCLead: (lead: AcquisitionVCLead, isPublic: boolean) => void,
  onViewPublicPool: () => void,
  onViewApplications: () => void,
}) {
  const [activeTab, setActiveTab] = useState("ads")

  // 前端软删除：用 localStorage 持久化已隐藏的 id
  const HIDDEN_KEY = "merchant_hidden_ids"
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(HIDDEN_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  const hideItem = (id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  // 删除确认弹窗
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteName, setConfirmDeleteName] = useState("")

  const requestDelete = (id: string, name: string) => {
    setConfirmDeleteId(id)
    setConfirmDeleteName(name)
  }

  const confirmDelete = () => {
    if (confirmDeleteId) hideItem(confirmDeleteId)
    setConfirmDeleteId(null)
    setConfirmDeleteName("")
  }

  // Separate B2B leads by type
  const followLeads = b2bLeads.filter(l => l.type === "follow")
  const publishLeads = b2bLeads.filter(l => l.type === "publish")
  const isVerified = profile && profile.isMerchantVerified

  // 如果未认证商家，显示认证提示
  if (!isVerified && profile) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-purple-50 p-3 text-purple-600"><Building2 size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">{t("merchant_identity")}</div>
              <div className="font-bold">{t("uncertified_merchant_label")}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><BarChart3 size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">{t("total_ad_spend")}</div>
              <div className="text-2xl font-bold">¥0</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-green-50 p-3 text-green-600"><Network size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">{t("lead_conversion")}</div>
              <div className="text-2xl font-bold">0%</div>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t("unlock_merchant_title")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("unlock_merchant_desc")}
            </p>
            <Button size="lg" onClick={() => onVerify('merchant')} className="bg-purple-600 hover:bg-purple-700">
              <Building2 className="mr-2 h-5 w-5" /> {t("verify_merchant_now")}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              After verification you can post ads, manage leads, connect with VCs and enjoy exclusive benefits.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
          <div className="rounded-lg border bg-purple-50 p-3 text-purple-600"><Building2 size={20} /></div>
          <div>
            <div className="text-sm text-muted-foreground">{t("merchant_identity")}</div>
            <div className="font-bold">{!profile?.isMerchantVerified ? t("uncertified_merchant_label") : profile?.isRealMerchant ? '💎 Verified Merchant (subsidized)' : t("merchant_verified")}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
          <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><BarChart3 size={20} /></div>
          <div>
            <div className="text-sm text-muted-foreground">{t("total_ad_spend")}</div>
            <div className="text-2xl font-bold">¥50.00</div>
          </div>
        </div>
        <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
          <div className="rounded-lg border bg-green-50 p-3 text-green-600"><Network size={20} /></div>
          <div>
            <div className="text-sm text-muted-foreground">{t("lead_conversion")}</div>
            <div className="text-2xl font-bold">12.5%</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div 
          className="grid w-full grid-cols-3 mb-4 p-1 rounded-2xl gap-1"
          style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(203,213,225,0.5)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
          }}
        >
          <button 
            onClick={() => setActiveTab("ads")}
            className={`relative rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 py-2 overflow-hidden ${
              activeTab === "ads"
                ? 'text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
            style={{
              background: activeTab === "ads"
                ? 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
                : 'transparent'
            }}
          >
            {t("my_ads")}
          </button>
          <button 
            onClick={() => setActiveTab("leads")}
            className={`relative rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 py-2 overflow-hidden ${
              activeTab === "leads"
                ? 'text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
            style={{
              background: activeTab === "leads"
                ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                : 'transparent'
            }}
          >
            <span className="hidden sm:inline">{t("enterprise_leads")}</span>
            <span className="sm:hidden">B2B</span>
          </button>
          <button 
            onClick={() => setActiveTab("vc")}
            className={`relative rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 py-2 overflow-hidden ${
              activeTab === "vc"
                ? 'text-white shadow-lg' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
            style={{
              background: activeTab === "vc"
                ? 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
                : 'transparent'
            }}
          >
            <span className="hidden sm:inline">{t("vc_leads")}</span>
            <span className="sm:hidden">VC</span>
          </button>
        </div>

        <TabsContent value="ads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("publish_ad_earn_section")}</h4>
            <Button size="sm" onClick={onAddAd} className="bg-blue-600"><Plus className="mr-2 h-4 w-4" /> {t("publish_ad")}</Button>
          </div>
          
          <div 
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(224,234,255,0.8)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.08)'
            }}
          >
            <Table>
              <TableHeader>
                <TableRow 
                  className="border-b"
                  style={{ 
                    background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%)',
                    borderBottom: '1px solid #e0eaff'
                  }}
                >
                  <TableHead className="font-bold text-blue-900 py-4">{t("brand_name")}</TableHead>
                  <TableHead className="font-bold text-blue-900 py-4">{t("type")}</TableHead>
                  <TableHead className="font-bold text-blue-900 py-4">{t("duration")}</TableHead>
                  <TableHead className="font-bold text-blue-900 py-4">{t("views")}</TableHead>
                  <TableHead className="font-bold text-blue-900 py-4">{t("status")}</TableHead>
                  <TableHead className="text-right font-bold text-blue-900 py-4">{t("operation")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">{t("no_ads")}</TableCell></TableRow>
                ) : (
                  ads.map((ad, index) => (
                    <TableRow 
                      key={ad.id || ad._id || index}
                      className="transition-all duration-200"
                      style={{
                        background: index % 2 === 0 ? '#f8fbff' : '#f0f7ff',
                        borderBottom: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e6f3ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? '#f8fbff' : '#f0f7ff';
                      }}
                    >
                      <TableCell className="font-semibold text-slate-800 py-4">{ad.brand}</TableCell>
                      <TableCell className="py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100/50 text-blue-700 border border-blue-200/50">
                          {ad.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 py-4">{ad.duration}</TableCell>
                      <TableCell className="text-slate-600 py-4 font-mono">{ad.views}</TableCell>
                      <TableCell className="py-4"><StatusBadge status={ad.status} /></TableCell>
                      <TableCell className="text-right py-4">
                        <button 
                          onClick={() => onUpdateStatus('ad', ad)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          Settings
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          {/* Follow Leads Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t("my_follow_customers")}
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">{followLeads.length}</Badge>
              </h4>
              <Button size="sm" onClick={onAddB2BFollow} className="bg-purple-600"><Plus className="mr-2 h-4 w-4" /> {t("add_customer")}</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {followLeads.length === 0 ? (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm bg-slate-50/30">
                  No tracked customers yet. Click &quot;Add Customer&quot; to add one.
                </div>
              ) : (
                followLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    className="relative group rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(168,85,247,0.2)',
                      boxShadow: '0 4px 20px rgba(168,85,247,0.05)'
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 font-bold shadow-inner">
                          {lead.name[0]}
                        </div>
                        <h3 className="font-bold text-slate-800">{lead.name}</h3>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center text-sm text-slate-500">
                        <Globe size={14} className="mr-2 opacity-70" /> {lead.region}
                        <span className="mx-2 opacity-30">|</span>
                        <User size={14} className="mr-2 opacity-70" /> {lead.contact}
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-slate-400 mr-2">Est. Value:</span>
                        <span className="text-emerald-600 font-bold font-mono">¥{lead.estValue}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateStatus('b2b', lead)}
                        className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-all duration-300"
                      >
                        Update Progress
                      </button>
                      <a 
                        href={`mailto:${lead.email}?subject=Cooperation Invitation from mornbusiness`}
                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-purple-600 hover:bg-purple-50 border border-slate-100 transition-all duration-300"
                      >
                        <Mail size={18} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Publish Leads Section */}
          <div className="space-y-4 pt-8 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t("my_publish_demands")}
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">{publishLeads.length}</Badge>
              </h4>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={onViewPublicPool} className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50">
                  <Globe className="mr-1 h-3 w-3" /> <span className="hidden sm:inline">{t("leads_pool_btn")}</span><span className="sm:hidden">Pool</span>
                </Button>
                <Button size="sm" variant="outline" onClick={onViewApplications} className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50">
                  <Handshake className="mr-1 h-3 w-3" /> <span className="hidden sm:inline">{t("received_applications")}</span><span className="sm:hidden">Apps</span>
                </Button>
                <Button size="sm" onClick={onAddB2BPublish} className="bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/20">
                  <Plus className="mr-1 h-3 w-3" /> {t("publish_demand")}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {publishLeads.length === 0 ? (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm bg-slate-50/30">
                  No demands posted yet. Click &quot;Post Demand&quot; to add one.
                </div>
              ) : (
                publishLeads.map(lead => (
                  <div 
                    key={lead.id}
                    className={`relative group rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${hiddenIds.has(lead.id) ? "hidden" : ""}`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: lead.isPublic ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(203,213,225,0.4)',
                      boxShadow: lead.isPublic ? '0 4px 20px rgba(16,185,129,0.05)' : '0 4px 20px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-inner ${lead.isPublic ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {lead.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800">{lead.name}</h3>
                            {lead.isPublic ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">Published</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-bold">Draft</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* 右上角删除按钮 */}
                      <button
                        onClick={() => requestDelete(lead.id, lead.name)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all text-xs font-bold"
                        title="从页面移除"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center text-sm text-slate-500">
                        <Globe size={14} className="mr-2 opacity-70" /> {lead.region}
                        <span className="mx-2 opacity-30">|</span>
                        <User size={14} className="mr-2 opacity-70" /> {lead.contact}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-xs text-slate-400 mr-2">Est. Value:</span>
                          <span className="text-emerald-600 font-bold font-mono">¥{lead.estValue}</span>
                        </div>
                        {lead.cooperationCount! > 0 && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{lead.cooperationCount} applications</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onPublishLead(lead, !lead.isPublic)}
                        className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 border ${
                          lead.isPublic 
                            ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                        }`}
                      >
                        {lead.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                        {lead.isPublic ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => requestDelete(lead.id, lead.name)}
                        className="p-2 rounded-xl bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 border border-red-100 transition-all duration-300"
                        title="Remove from page"
                      >
                        <X size={16} />
                      </button>
                      <a 
                        href={`mailto:${lead.email}?subject=Cooperation Invitation from mornbusiness`}
                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-100 transition-all duration-300"
                      >
                        <Mail size={18} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vc" className="space-y-8">
          {/* 跟进的 VC 线索 */}
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                {t("my_follow_vc")}
              </h4>
              <Button size="sm" onClick={onAddVCFollow} className="bg-emerald-600"><Plus className="mr-2 h-4 w-4" /> {t("add_vc")}</Button>
            </div>
            
            <div 
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(224,234,255,0.8)',
                boxShadow: '0 8px 32px rgba(16,185,129,0.08)'
              }}
            >
              <Table>
                <TableHeader>
                  <TableRow 
                    className="border-b"
                    style={{ 
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderBottom: '1px solid #dcfce7'
                    }}
                  >
                    <TableHead className="font-bold text-emerald-900 py-4">Institution</TableHead>
                    <TableHead className="font-bold text-emerald-900 py-4">Focus</TableHead>
                    <TableHead className="font-bold text-emerald-900 py-4">Stage</TableHead>
                    <TableHead className="text-right font-bold text-emerald-900 py-4">{t("operation")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vcFollowLeads.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-500">No tracked VC institutions</TableCell></TableRow>
                  ) : (
                    vcFollowLeads.map((vc, index) => (
                      <TableRow 
                        key={vc.id}
                        className="transition-all duration-200"
                        style={{
                          background: index % 2 === 0 ? '#fafffd' : '#f0fdf4',
                          borderBottom: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dcfce7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = index % 2 === 0 ? '#fafffd' : '#f0fdf4';
                        }}
                      >
                        <TableCell className="py-4">
                          <div className="font-bold text-slate-800">{vc.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{vc.contact}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-xs text-slate-600 bg-white/50 px-2 py-1 rounded border border-emerald-100">{vc.focus}</span>
                        </TableCell>
                        <TableCell className="py-4"><StatusBadge status={vc.status} /></TableCell>
                        <TableCell className="text-right py-4">
                          <button 
                            onClick={() => onUpdateStatus('vc', vc)}
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-200"
                          >
                            Update Stage
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 发布型融资需求 */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t("my_publish_funding")}
              </h4>
              <Button size="sm" onClick={onAddVCPublish} className="bg-emerald-600"><Plus className="mr-2 h-4 w-4" /> {t("publish_funding")}</Button>
            </div>
            
            <div 
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(224,234,255,0.8)',
                boxShadow: '0 8px 32px rgba(16,185,129,0.08)'
              }}
            >
              <Table>
                <TableHeader>
                  <TableRow 
                    className="border-b"
                    style={{ 
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderBottom: '1px solid #dcfce7'
                    }}
                  >
                    <TableHead className="font-bold text-emerald-900 py-4">Company</TableHead>
                    <TableHead className="font-bold text-emerald-900 py-4">Funding / Stage</TableHead>
                    <TableHead className="font-bold text-emerald-900 py-4">{t("status")}</TableHead>
                    <TableHead className="text-right font-bold text-emerald-900 py-4">{t("operation")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vcPublishLeads.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-500">No funding demands posted</TableCell></TableRow>
                  ) : (
                    vcPublishLeads.map((vc, index) => (
                      <TableRow 
                        key={vc.id}
                        className={`transition-all duration-200 ${hiddenIds.has(vc.id) ? "hidden" : ""}`}
                        style={{
                          background: index % 2 === 0 ? '#fafffd' : '#f0fdf4',
                          borderBottom: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dcfce7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = index % 2 === 0 ? '#fafffd' : '#f0fdf4';
                        }}
                      >
                        <TableCell className="py-4">
                          <div className="font-bold text-slate-800">{vc.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{vc.contact}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-emerald-600 font-bold text-sm">{vc.fundingAmount || '-'}</div>
                          <div className="text-[10px] text-slate-400">{vc.fundingStage || '-'}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          {vc.isPublic ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Published</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200">Draft</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onPublishVCLead(vc, !vc.isPublic)}
                              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                                vc.isPublic ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {vc.isPublic ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => requestDelete(vc.id, vc.name)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              title="从页面移除"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 删除确认弹窗 */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.96) 0%,rgba(255,241,242,0.92) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.7)",
            }}
          >
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white">{t("confirm_delete")}</h3>
                <p className="text-white/70 text-xs mt-1">
                  Will remove &quot;{confirmDeleteName}&quot; from view (database unaffected)
                </p>
              </div>
            </div>
            <div className="p-6 flex gap-3">
              <button
                onClick={() => { setConfirmDeleteId(null); setConfirmDeleteName("") }}
                className="flex-1 h-11 rounded-full border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                {t("no_cancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold shadow-lg shadow-red-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <X size={15} /> {t("yes_delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// Main Client Component
// ==========================================
export function AcquisitionClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialMode = (searchParams.get("mode") as ViewMode) || "task"
  
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode)
  const [toastMessage, setToastMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  const [bloggers, setBloggers] = useState<AcquisitionBlogger[]>([])
  const [allBloggers, setAllBloggers] = useState<AcquisitionBlogger[]>([])
  const [b2bLeads, setB2bLeads] = useState<AcquisitionB2BLead[]>([])
  const [vcFollowLeads, setVcFollowLeads] = useState<AcquisitionVCLead[]>([])
  const [vcPublishLeads, setVcPublishLeads] = useState<AcquisitionVCLead[]>([])
  const [ads, setAds] = useState<AcquisitionAd[]>([])
  const [profile, setProfile] = useState<UserMarketProfile>()
  const [bloggerProfile, setBloggerProfile] = useState<AcquisitionBlogger>()
  const [influencerSubMode, setInfluencerSubMode] = useState<'pool' | 'personal'>('pool')
  const [participations, setParticipations] = useState<AdParticipation[]>([])
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)

  // Modal states
  const [formModal, setFormModal] = useState<{ isOpen: boolean; type: "blogger" | "b2b" | "b2b_follow" | "b2b_publish" | "vc_follow" | "vc_publish" | "ad" | "realName" | "new_blogger" | "influencer" | "merchant" | null; initialData?: any }>({ isOpen: false, type: null })
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; title: string; currentStatus: string; statuses: string[]; onConfirm: (s: string) => void } | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(""), 3000)
  }, [])

  const fetchBootstrap = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/market/admin/acquisition", { credentials: "include" })
      const json = await response.json()
      if (!json.success) throw new Error(json.error || "Failed to load data")

      const data: AcquisitionBootstrapData = json.data
      setBloggers(data.bloggers)
      setAllBloggers(data.allBloggers || [])
      setB2bLeads(data.b2bLeads)
      setVcFollowLeads(data.vcFollowLeads || [])
      setVcPublishLeads(data.vcPublishLeads || [])
      setAds(data.ads)
      setProfile(data.profile)
      setBloggerProfile(data.bloggerProfile)
      setParticipations(data.participations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBootstrap()
  }, [fetchBootstrap])

  // 监听用户登录状态变化（localStorage 中的 market_user）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'market_user') {
        fetchBootstrap()
      }
    }

    // 添加 storage 事件监听器
    window.addEventListener('storage', handleStorageChange)

    // 检查当前是否有用户登录（从 localStorage）
    const userStr = localStorage.getItem('market_user')
    if (userStr && !profile) {
      fetchBootstrap()
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchBootstrap, profile])

  const postAction = useCallback(async (action: string, data: any) => {
    setActionLoading(true)
    try {
      const response = await fetch("/api/market/admin/acquisition", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      })
      const json = await response.json()
      if (!json.success) throw new Error(json.error || "Action failed")
      await fetchBootstrap() // Refresh data
      return json.result
    } catch (err) {
      showToast(`❌ ${err instanceof Error ? err.message : "Action failed"}`)
      return null
    } finally {
      setActionLoading(false)
    }
  }, [fetchBootstrap, showToast])

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", mode)
    router.push(`?${params.toString()}`)
  }

  const ensureLoggedIn = useCallback(() => {
    if (!profile) {
      setIsLoginPromptOpen(true)
      return false
    }
    return true
  }, [profile])

  // Action handlers
  const handleParticipate = async (ad: AcquisitionAd) => {
    if (!ensureLoggedIn()) return
    // 实名认证检查已注释掉，将来再启用
    // if (!profile?.isRealNameVerified) {
    //   showToast("⚠️ 请先完成实名认证后再参与任务")
    //   return
    // }
    const result = await postAction("participate_ad", { adId: ad.id, reward: ad.reward })
    if (result) showToast(`✅ Started task: ${ad.brand}`)
  }

  const handleComplete = async (p: AdParticipation) => {
    if (!ensureLoggedIn()) return
    const result = await postAction("complete_ad_task", { participationId: p.id })
    if (result) showToast(`🎉 Task complete! Earned: ¥${p.rewardEarned}`)
  }

  const handleVerify = async (type: "realName" | "influencer" | "merchant", data?: any) => {
    if (!ensureLoggedIn()) return

    // 如果已经有数据，直接调用API（从表单提交过来的）
    if (data) {
      if (type === "influencer") {
        // 调用达人认证API
        try {
          const response = await fetch("/api/profile/influencer-apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          if (result.ok) {
            showToast("✅ Influencer verification successful!")
            fetchBootstrap()
          } else {
            showToast(`❌ ${result.message || "Verification failed"}`)
          }
        } catch (err) {
          showToast("❌ Network error, please try again")
        }
      } else if (type === "merchant") {
        try {
          let businessLicenseUrl = ""
          
          // 如果有文件对象，先上传文件
          const file = data['businessLicense_file']
          if (file && typeof file === 'object' && file instanceof File) {
            showToast("📤 正在上传营业执照...")
            const uploadFormData = new FormData()
            uploadFormData.append("file", file)
            uploadFormData.append("bucket", "business-license")
            
            const uploadResponse = await fetch("/api/upload/video", {
              method: "POST",
              body: uploadFormData
            })
            const uploadResult = await uploadResponse.json()
            if (uploadResult.ok) {
              businessLicenseUrl = uploadResult.data.videoUrl
            } else {
              showToast(`❌ ${uploadResult.message || "文件上传失败"}`)
              return
            }
          } else if (data['businessLicense']) {
            // 如果是字符串，可能是已有的URL或者只是文件名
            businessLicenseUrl = data['businessLicense']
          }
          
          const submitData = {
            ...data,
            businessLicenseUrl
          }
          
          const response = await fetch("/api/profile/merchant-apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData)
          })
          const result = await response.json()
          if (result.ok) {
            showToast("✅ Merchant verification successful!")
            fetchBootstrap()
          } else {
            showToast(`❌ ${result.message || "Verification failed"}`)
          }
        } catch (err) {
          showToast("❌ Network error, please try again")
        }
      } else if (type === "realName") {
        // 实名认证处理已注释掉，将来再启用
        // const requestData = { type, ...data }
        // const result = await postAction("update_verification", requestData)
        // if (result) {
        //   showToast(`✅ 认证成功！`)
        // }
      }
      return
    }

    // 如果没有数据，打开对应的表单模态框
    if (type === "influencer" || type === "merchant") {
      setFormModal({ isOpen: true, type })
    } else if (type === "realName") {
      // 实名认证处理已注释掉，将来再启用
      // setFormModal({ isOpen: true, type: "realName" })
    }
  }

  const handleStatusUpdate = (type: 'ad' | 'b2b' | 'vc' | 'blogger', item: any) => {
    if (!ensureLoggedIn()) return
    const configs: Record<string, { title: string, statuses: string[], action: string }> = {
      ad: { title: `Ad settings: "${item.brand}"`, statuses: ["投放中", "已暂停", "已下架"], action: "update_ad" },
      b2b: { title: `Update lead: "${item.name}"`, statuses: ["初步接触", "跟进中", "合同拟定", "已转化", "已流失"], action: "update_b2b_status" },
      vc: { title: `Advance stage: "${item.name}"`, statuses: ["待联系", "初步接触", "深度沟通(Pitch)", "尽职调查", "已投资", "已拒绝"], action: "update_vc_status" },
      blogger: { title: `Update order: "${item.name}"`, statuses: ["未联系", "已联系", "谈判中", "已合作", "已拒绝"], action: "update_blogger_status" },
    }
    const config = configs[type]
    setStatusModal({
      isOpen: true,
      title: config.title,
      currentStatus: item.status,
      statuses: config.statuses,
      onConfirm: async (newStatus) => {
        const result = await postAction(config.action, { id: item.id, status: newStatus })
        if (result) {
          showToast(`✅ Updated to: ${newStatus}`)
          setStatusModal(null)
        }
      }
    })
  }

  const handleFormSubmit = async (formData: any) => {
    if (!ensureLoggedIn()) return
    const type = formModal.type
    if (!type) return

    if (type === "realName") {
      handleVerify("realName", formData)
      return
    }

    // 处理达人认证和商家认证
    if (type === "influencer" || type === "merchant") {
      handleVerify(type, formData)
      setFormModal({ isOpen: false, type: null })
      return
    }

    const action = type === 'new_blogger' ? 'insert_blogger' : type === 'blogger' ? 'update_influencer_profile' : `insert_${type === 'b2b' || type === 'b2b_follow' || type === 'b2b_publish' ? 'b2b_lead' : type === 'vc_follow' || type === 'vc_publish' ? 'vc_lead' : 'ad'}`

    // Add type field for B2B leads
    if (type === 'b2b_follow') {
      formData.type = 'follow'
    } else if (type === 'b2b_publish') {
      formData.type = 'publish'
    }

    // Add type field for VC leads
    if (type === 'vc_follow') {
      formData.type = 'follow'
    } else if (type === 'vc_publish') {
      formData.type = 'publish'
    }
    const result = await postAction(action, formData)
    if (result) {
      showToast(type === 'new_blogger' ? "✅ 已新增博主账号" : type === 'blogger' ? "✅ 达人资料已更新" : "🎉 数据已录入系统！")
      setFormModal({ isOpen: false, type: null })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={40} /></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64 flex-col gap-4">
          <div className="text-destructive text-lg font-medium">Failed to load: {error}</div>
          <Button onClick={fetchBootstrap}>Retry</Button>
        </div>
      </div>
    )
  }

  // 从 localStorage 获取用户信息（用于在 profile 加载前显示）
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem('market_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to parse stored user:', error);
    }
    return null;
  };

  const storedUser = getStoredUser();
  const isLoggedIn = !!(profile || storedUser);
  const displayUser = profile || storedUser;

  return (
    <div className="relative">
      {/* Debug info */}
      <div className="hidden">
        Profile: {profile ? JSON.stringify(profile) : 'undefined'},
        User from localStorage: {localStorage.getItem('market_user') || 'none'}
      </div>
      {/* Unified Header */}
      <header className="flex flex-col gap-3 mb-6">
        {/* Top row: title + right actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center tracking-tight">
              <span className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-1.5 rounded-xl mr-2 shadow-lg shadow-blue-500/25 flex-shrink-0">
                <Target size={20} />
              </span>
              <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent truncate">
                {t("system_title")}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => window.location.href = '/market/ai-search'}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md hover:from-violet-600 hover:to-purple-700 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  🤖 <span className="hidden sm:inline">{t("ai_search")}</span><span className="sm:hidden">AI</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-slate-900 text-white p-3 rounded-lg">
                <div className="font-medium mb-1">AI Smart Search</div>
                <div className="text-xs text-slate-200 space-y-1">
                  <p>Enter blogger, enterprise, or VC information, AI automatically searches and extracts:</p>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    <li>Name & contact email</li>
                    <li>Website & introduction</li>
                    <li>Support direct cooperation invitations</li>
                  </ul>
                  <p className="mt-2 text-xs text-slate-300">¥0.1 per search, 100 searches/month limit</p>
                </div>
              </TooltipContent>
            </Tooltip>
            <NotificationCenter isLoggedIn={isLoggedIn} />
            {isLoggedIn ? (
              <UserAvatarDropdown
                user={{
                  userId: displayUser?.userId || displayUser?.id || '',
                  nickname: (() => {
                    if (profile?.nickname) return profile.nickname;
                    if (storedUser?.nickname) return storedUser.nickname;
                    if (storedUser?.email) return storedUser.email.split('@')[0];
                    return 'Demo User';
                  })(),
                  avatar: profile?.avatar,
                  email: (() => {
                    if (storedUser?.email) return storedUser.email;
                    if (profile?.email) return profile.email;
                    return '';
                  })()
                }}
              />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsLoginPromptOpen(true)} className="text-xs px-3">
                {t("login")}
              </Button>
            )}
          </div>
        </div>

        {/* Mode Switch - full width on mobile */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-sm">
          {[
            { mode: 'task' as ViewMode, label: t("task_mode"), gradient: 'from-blue-500 to-cyan-500' },
            { mode: 'influencer' as ViewMode, label: t("influencer_mode"), gradient: 'from-purple-500 to-pink-500' },
            { mode: 'merchant' as ViewMode, label: t("merchant_mode"), gradient: 'from-emerald-500 to-teal-500' },
          ].map(({ mode, label, gradient }) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`relative flex-1 px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 overflow-hidden text-center
                ${viewMode === mode ? 'text-white shadow-lg' : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'}`}
            >
              {viewMode === mode && (
                <span className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-100`} />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Verification & Profile - Only show in Task/Merchant mode, or Personal Influencer mode */}
      {(viewMode !== "influencer" || influencerSubMode === "personal") && (
        <VerificationCard profile={profile} onVerify={handleVerify} />
      )}

      {/* Content based on Mode */}
      <div className="min-h-[400px] animate-in fade-in duration-500">
        {viewMode === "task" && (
          <TaskModeView 
            ads={ads} 
            profile={profile} 
            participations={participations}
            onParticipate={handleParticipate}
            onComplete={handleComplete}
          />
        )}
        {viewMode === "influencer" && (
          <InfluencerModeView
            profile={profile}
            bloggerProfile={bloggerProfile}
            bloggers={bloggers}
            allBloggers={allBloggers}
            subMode={influencerSubMode}
            onSetSubMode={setInfluencerSubMode}
            onUpdateProfile={(blogger) => {
              if (ensureLoggedIn()) setFormModal({ isOpen: true, type: "blogger", initialData: blogger })
            }}
            onAddBlogger={() => { if (ensureLoggedIn()) setFormModal({ isOpen: true, type: "new_blogger" }) }}
            onDeleteBlogger={async (id) => {
              if (!ensureLoggedIn()) return
              const result = await postAction("delete_blogger_soft", { id })
              if (result) showToast("✅ 已删除博主账号")
            }}
            onVerify={handleVerify}
          />
        )}
        {viewMode === "merchant" && (
          <MerchantModeView
            ads={ads.filter(a => a.userId === profile?.id)}
            b2bLeads={b2bLeads}
            vcFollowLeads={vcFollowLeads}
            vcPublishLeads={vcPublishLeads}
            profile={profile}
            onAddAd={() => { if (ensureLoggedIn()) setFormModal({ isOpen: true, type: "ad" }) }}
            onAddB2BFollow={() => { if (ensureLoggedIn()) setFormModal({ isOpen: true, type: "b2b_follow" }) }}
            onAddB2BPublish={() => { if (ensureLoggedIn()) setFormModal({ isOpen: true, type: "b2b_publish" }) }}
            onAddVCFollow={() => { if (ensureLoggedIn()) setFormModal({ isOpen: true, type: "vc_follow" }) }}
            onAddVCPublish={() => { if (ensureLoggedIn()) setFormModal({ isOpen: true, type: "vc_publish" }) }}
            onUpdateStatus={(type, item) => handleStatusUpdate(type, item)}
            onVerify={handleVerify}
            onPublishLead={async (lead, isPublic) => {
              if (!ensureLoggedIn()) return
              const result = await postAction("publish_b2b_lead", { leadId: lead.id, isPublic })
              if (result) {
                showToast(isPublic ? "✅ 需求已上架到线索池" : "✅ 需求已下架")
              }
            }}
            onPublishVCLead={async (lead, isPublic) => {
              if (!ensureLoggedIn()) return
              const result = await postAction("publish_vc_lead", { leadId: lead.id, isPublic })
              if (result) {
                showToast(isPublic ? "✅ 融资需求已上架到 VC 线索池" : "✅ 融资需求已下架")
              }
            }}
            onViewPublicPool={() => router.push("/market/leads-pool")}
            onViewApplications={() => router.push("/market/my-applications")}
          />
        )}
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 z-50 animate-in slide-in-from-bottom-10">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Action Loading */}
      {actionLoading && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-[1px] z-[60] flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg border flex items-center space-x-3">
            <Loader2 className="animate-spin text-primary" size={20} />
            <span className="text-sm font-medium">{t("processing_action")}</span>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formModal.isOpen && formModal.type && (
        <AddFormModal 
          type={formModal.type} 
          onClose={() => setFormModal({ isOpen: false, type: null, initialData: undefined })} 
          onSubmit={handleFormSubmit}
          initialData={formModal.initialData}
        />
      )}

      {/* Status Modal */}
      {statusModal && (
        <StatusSelectModal
          title={statusModal.title}
          currentStatus={statusModal.currentStatus}
          statuses={statusModal.statuses}
          onClose={() => setStatusModal(null)}
          onConfirm={statusModal.onConfirm}
        />
      )}

      {/* Login Prompt */}
      <LoginPrompt isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
    </div>
  )
}

// ==========================================
// Modal: Add form (generic for all 4 types)
// ==========================================
function AddFormModal({ type, onClose, onSubmit, initialData }: {
  type: "blogger" | "b2b" | "b2b_follow" | "b2b_publish" | "vc" | "vc_follow" | "vc_publish" | "ad" | "realName" | "influencer" | "merchant" | "new_blogger"
  onClose: () => void
  onSubmit: (data: Record<string, string | File>) => void
  initialData?: Record<string, string>
}) {
  const [formData, setFormData] = useState<Record<string, string | File>>(initialData || {})
  const [publishToPool, setPublishToPool] = useState(false)
  // 视频上传状态
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoUploadProgress, setVideoUploadProgress] = useState("")
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (name: string, value: string | File) => setFormData((prev) => ({ ...prev, [name]: value }))

  const handleVideoUpload = async (file: File) => {
    if (!file) return
    setVideoUploading(true)
    setVideoUploadProgress(isIntl ? "Uploading..." : "上传中...")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload/video", { method: "POST", credentials: "include", body: fd })
      const json = await res.json()
      if (json.ok && json.data?.videoUrl) {
        handleChange("videoUrl", json.data.videoUrl)
        setVideoUploadProgress(isIntl ? "✓ Uploaded" : "✓ 上传成功")
      } else {
        setVideoUploadProgress(`✗ ${json.message || (isIntl ? "Upload failed" : "上传失败")}`)
      }
    } catch {
      setVideoUploadProgress(isIntl ? "✗ Network error" : "✗ 网络错误，请重试")
    } finally {
      setVideoUploading(false)
    }
  }

  const handleSubmitWithPublish = (e: React.FormEvent) => {
    e.preventDefault()
    if (type === "b2b" && publishToPool) {
      onSubmit({ ...formData, publishToPool: "true" })
    } else {
      onSubmit(formData)
    }
  }

  const configs: Record<string, { title: string; icon: React.ReactNode; gradient: string; wide?: boolean; showPublishOption?: boolean; fields: Array<{ name: string; label: string; type: string; placeholder?: string; options?: string[]; step?: string; fullWidth?: boolean }> }> = {
    blogger: {
      title: isIntl ? "Influencer Profile Setup" : "达人资料设置",
      icon: <Users className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-500",
      fields: [
        { name: "name", label: isIntl ? "Nickname" : "达人昵称", type: "text", placeholder: isIntl ? "Your account name" : "输入你的账号名称" },
        { name: "platform", label: isIntl ? "Main Platform" : "主营平台", type: "text", placeholder: isIntl ? "e.g. YouTube / TikTok / Instagram" : "选择你主要活跃的平台（抖音 / 小红书 / B 站 / 快手 / 视频号）" },
        { name: "email", label: isIntl ? "Contact Email" : "联系邮箱", type: "email", placeholder: isIntl ? "For receiving ad cooperation invites" : "用于接收广告合作邀请" },
        { name: "followers", label: isIntl ? "Followers" : "粉丝总量", type: "text", placeholder: isIntl ? "e.g. 10000" : "输入你的当前粉丝数（例：10000）" },
        { name: "cost", label: isIntl ? "Ad Price (per post)" : "单条广告报价（元）", type: "text", placeholder: isIntl ? "Your base ad fee" : "输入你期望的单条广告基础费用" },
        { name: "commission", label: isIntl ? "Commission Rate (%)" : "期望分成比例（%）", type: "text", placeholder: isIntl ? "Your expected profit share" : "输入你期望的利润分成比例" },
      ],
    },
    new_blogger: {
      title: isIntl ? "Add Blogger Account" : "新增博主账号",
      icon: <Plus className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-500",
      fields: [
        { name: "name", label: isIntl ? "Account Name" : "账号名称", type: "text", placeholder: isIntl ? "Enter account name" : "输入新账号名称" },
        { name: "platform", label: isIntl ? "Platform" : "所属平台", type: "text", placeholder: isIntl ? "e.g. YouTube, TikTok" : "如：抖音、小红书等" },
        { name: "email", label: isIntl ? "Contact Email" : "联系邮箱", type: "email", placeholder: isIntl ? "For ad cooperation invites" : "用于接收广告合作邀请" },
        { name: "followers", label: isIntl ? "Followers" : "粉丝数量", type: "text", placeholder: isIntl ? "Follower count" : "输入该账号的粉丝数" },
        { name: "cost", label: isIntl ? "Ad Price" : "单条报价（元）", type: "text", placeholder: isIntl ? "Ad price for this account" : "该账号的广告报价" },
        { name: "commission", label: isIntl ? "Commission (%)" : "期望分成（%）", type: "text", placeholder: isIntl ? "Expected commission rate" : "期望的分成比例" },
      ],
    },
    b2b_follow: {
      title: isIntl ? "Add Tracked Customer" : "录入跟进的客户",
      icon: <Building2 className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      fields: [
        { name: "name", label: isIntl ? "Company Name" : "企业名称", type: "text", placeholder: isIntl ? "e.g. Acme Corp" : "如：深圳XX科技公司" },
        { name: "region", label: isIntl ? "Region" : "所属区域", type: "text", placeholder: isIntl ? "e.g. New York / London" : "如：深圳/北京" },
        { name: "contact", label: isIntl ? "Contact & Title" : "联系人及职务", type: "text", placeholder: isIntl ? "e.g. John (CTO)" : "如：王总(CTO)" },
        { name: "email", label: isIntl ? "Contact Email" : "联系邮箱", type: "email", placeholder: isIntl ? "e.g. john@company.com" : "如：wang@company.com" },
        { name: "estValue", label: isIntl ? "Est. Value" : "预估客单价", type: "text", placeholder: isIntl ? "e.g. $30,000" : "如：¥30,000" },
      ],
    },
    b2b_publish: {
      title: isIntl ? "Post Cooperation Demand" : "发布合作需求",
      icon: <Globe className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      wide: true,
      fields: [
        { name: "name", label: isIntl ? "Demand Title" : "需求标题", type: "text", placeholder: isIntl ? "e.g. Looking for tech supplier in NYC" : "如：寻找深圳地区数码产品供应商", fullWidth: true },
        { name: "region", label: isIntl ? "Region" : "所属区域", type: "text", placeholder: isIntl ? "e.g. New York" : "如：深圳/北京" },
        { name: "contact", label: isIntl ? "Contact & Title" : "联系人及职务", type: "text", placeholder: isIntl ? "e.g. John (CTO)" : "如：王总(CTO)" },
        { name: "email", label: isIntl ? "Contact Email" : "联系邮箱", type: "email", placeholder: isIntl ? "e.g. john@company.com" : "如：wang@company.com" },
        { name: "estValue", label: isIntl ? "Est. Value" : "预估合作价值", type: "text", placeholder: isIntl ? "e.g. $30,000" : "如：¥30,000" },
        { name: "description", label: isIntl ? "Description" : "需求描述", type: "text", placeholder: isIntl ? "Describe your cooperation needs..." : "详细描述您的合作需求...", fullWidth: true },
      ],
    },
    b2b: {
      title: isIntl ? "Add Enterprise Lead" : "手工录入企业线索",
      icon: <Building2 className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      fields: [
        { name: "name", label: isIntl ? "Company Name" : "企业名称", type: "text", placeholder: isIntl ? "e.g. Acme Corp" : "如：深圳XX科技公司" },
        { name: "region", label: isIntl ? "Region" : "所属区域", type: "text", placeholder: isIntl ? "e.g. New York" : "如：深圳/北京" },
        { name: "contact", label: isIntl ? "Contact & Title" : "联系人及职务", type: "text", placeholder: isIntl ? "e.g. John (CTO)" : "如：王总(CTO)" },
        { name: "email", label: isIntl ? "Contact Email" : "联系邮箱", type: "email", placeholder: isIntl ? "e.g. john@company.com" : "如：wang@company.com" },
        { name: "estValue", label: isIntl ? "Est. Value" : "预估客单价", type: "text", placeholder: isIntl ? "e.g. $30,000" : "如：¥30,000" },
      ],
    },
    vc: {
      title: isIntl ? "Add VC Lead" : "添加投资机构线索",
      icon: <Landmark className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-500",
      fields: [
        { name: "name", label: isIntl ? "Institution Name" : "机构名称", type: "text", placeholder: isIntl ? "e.g. Sequoia Capital" : "如：高瓴创投" },
        { name: "region", label: isIntl ? "Region" : "区域", type: "text", placeholder: isIntl ? "e.g. San Francisco" : "如：北京" },
        { name: "contact", label: isIntl ? "Contact" : "联系人", type: "text", placeholder: isIntl ? "e.g. Sarah" : "如：李经理" },
        { name: "email", label: isIntl ? "Contact Email" : "联系邮箱", type: "email", placeholder: isIntl ? "e.g. sarah@fund.com" : "如：li@fund.com" },
        { name: "focus", label: isIntl ? "Investment Focus" : "关注领域", type: "text", placeholder: isIntl ? "e.g. AI / SaaS" : "如：AI/SaaS" },
      ],
    },
    vc_follow: {
      title: isIntl ? "Add VC Institution" : "录入 VC 机构",
      icon: <Landmark className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-500",
      fields: [
        { name: "name", label: isIntl ? "Institution Name" : "机构名称", type: "text", placeholder: isIntl ? "e.g. Sequoia Capital" : "如：高瓴创投" },
        { name: "region", label: isIntl ? "Region" : "区域", type: "text", placeholder: isIntl ? "e.g. San Francisco" : "如：北京" },
        { name: "contact", label: isIntl ? "Contact" : "联系人", type: "text", placeholder: isIntl ? "e.g. Sarah" : "如：李经理" },
        { name: "email", label: isIntl ? "Contact Email" : "联系邮箱", type: "email", placeholder: isIntl ? "e.g. sarah@fund.com" : "如：li@fund.com" },
        { name: "focus", label: isIntl ? "Investment Focus" : "关注领域", type: "text", placeholder: isIntl ? "e.g. AI / SaaS" : "如：AI/SaaS" },
      ],
    },
    vc_publish: {
      title: isIntl ? "Post Funding Demand" : "发布融资需求",
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-500",
      wide: true,
      fields: [
        { name: "name", label: isIntl ? "Company Name" : "企业名称", type: "text", placeholder: isIntl ? "e.g. My Tech Co." : "如：我的科技公司", fullWidth: true },
        { name: "region", label: isIntl ? "Region" : "区域", type: "text", placeholder: isIntl ? "e.g. San Francisco" : "如：北京" },
        { name: "contact", label: isIntl ? "Contact" : "联系人", type: "text", placeholder: isIntl ? "e.g. CEO" : "如：张总" },
        { name: "email", label: isIntl ? "Contact Email" : "联系邮箱", type: "email", placeholder: isIntl ? "e.g. ceo@company.com" : "如：zhang@company.com" },
        { name: "focus", label: isIntl ? "Industry" : "行业领域", type: "text", placeholder: isIntl ? "e.g. AI / SaaS" : "如：AI/SaaS" },
        { name: "fundingAmount", label: isIntl ? "Funding Amount" : "融资金额", type: "text", placeholder: isIntl ? "e.g. $1M" : "如：1000万" },
        { name: "fundingStage", label: isIntl ? "Funding Stage" : "融资阶段", type: "text", placeholder: isIntl ? "e.g. Pre-A" : "如：Pre-A轮" },
        { name: "description", label: isIntl ? "Description" : "需求描述", type: "text", placeholder: isIntl ? "Describe your funding needs..." : "详细描述融资需求...", fullWidth: true },
      ],
    },
    ad: {
      title: isIntl ? "Post New Ad" : "发布新广告位",
      icon: <PlaySquare className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      fields: [
        { name: "brand", label: isIntl ? "Brand Name" : "广告品牌", type: "text", placeholder: isIntl ? "e.g. My App" : "如：某出行App" },
        { name: "type", label: isIntl ? "Ad Type" : "广告类型", type: "select", options: isIntl ? ["Video Ad", "Interactive Ad", "Banner Image"] : ["视频广告", "互动广告", "横幅图片"] },
        { name: "duration", label: isIntl ? "Required Duration" : "要求时长", type: "text", placeholder: isIntl ? "e.g. 30s" : "如：30s" },
        { name: "reward", label: isIntl ? "Reward Amount" : "奖励金额", type: "text", placeholder: isIntl ? "e.g. 0.5 USD" : "如：0.5 RMB" },
        { name: "videoUrl", label: isIntl ? "Video (optional)" : "视频链接（可选）", type: "video", placeholder: isIntl ? "Paste MP4 URL or upload" : "粘贴视频直链 URL，如 https://..." },
      ],
    },
    influencer: {
      title: isIntl ? "Influencer Verification" : "达人认证申请",
      icon: <Award className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-500",
      wide: true,
      fields: [
        { name: "platform", label: isIntl ? "Main Platform" : "主营平台", type: "text", placeholder: isIntl ? "e.g. YouTube / Instagram / TikTok" : "如：抖音 / 小红书 / B站 / 快手" },
        { name: "platformAccount", label: isIntl ? "Account Name" : "平台账号", type: "text", placeholder: isIntl ? "Your account username" : "输入您的平台账号名" },
        { name: "platformHomeUrl", label: isIntl ? "Profile URL" : "主页链接", type: "text", placeholder: isIntl ? "Your profile link (optional)" : "输入您的主页链接（可选）", fullWidth: true },
        { name: "followers", label: isIntl ? "Followers" : "粉丝总量", type: "text", placeholder: isIntl ? "e.g. 10000" : "如：10000" },
        { name: "cost", label: isIntl ? "Ad Price (per post)" : "单条广告报价（元）", type: "text", placeholder: isIntl ? "e.g. 100" : "如：1000" },
        { name: "commission", label: isIntl ? "Commission Rate (%)" : "期望分成比例（%）", type: "text", placeholder: isIntl ? "e.g. 20" : "如：20", fullWidth: true },
      ],
    },
    merchant: {
      title: isIntl ? "Merchant Verification" : "商家认证申请",
      icon: <Building2 className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-500",
      wide: true,
      fields: [
        { name: "companyName", label: isIntl ? "Company Name" : "公司名称", type: "text", placeholder: isIntl ? "Your company full name" : "输入您的公司全称", fullWidth: true },
        { name: "creditCode", label: isIntl ? "Business Reg. No." : "统一社会信用代码", type: "text", placeholder: isIntl ? "Business registration number" : "输入18位统一社会信用代码", fullWidth: true },
        { name: "businessLicense", label: isIntl ? "Business License" : "上传营业执照", type: "file", placeholder: isIntl ? "Upload business license" : "上传营业执照图片", fullWidth: true },
        { name: "brandName", label: isIntl ? "Brand Name" : "品牌名称", type: "text", placeholder: isIntl ? "Your brand name" : "输入您的品牌名称" },
        { name: "contactPerson", label: isIntl ? "Contact Person" : "联系人", type: "text", placeholder: isIntl ? "Contact name" : "输入联系人姓名" },
        { name: "contactPhone", label: isIntl ? "Contact Phone" : "联系电话", type: "text", placeholder: isIntl ? "Contact phone number" : "输入联系电话" },
        { name: "industry", label: isIntl ? "Industry" : "所属行业", type: "text", placeholder: isIntl ? "e.g. Beauty / Food / Tech" : "如：美妆 / 食品 / 数码" },
      ],
    },
  }

  const config = configs[type]
  if (!config) return null

  return (
    <ModalOverlay onClose={onClose}>
      <div 
        className={`w-full ${config.wide ? "max-w-2xl" : "max-w-md"} bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 mx-3 max-h-[92vh] flex flex-col`}
        style={{ border: '1px solid rgba(255,255,255,0.8)' }}
      >
        {/* Header with Gradient Background */}
        <div className={`px-6 py-6 bg-gradient-to-r ${config.gradient} relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/5 rounded-full blur-xl" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                {config.icon}
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {config.title}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitWithPublish} className="bg-white flex flex-col overflow-hidden" style={{maxHeight: 'calc(92vh - 88px)'}}>
          <div className={`grid ${config.wide ? "sm:grid-cols-2 grid-cols-1" : "grid-cols-1"} gap-x-5 gap-y-4 p-5 overflow-y-auto`}>
            {config.fields.map((field) => (
              <div key={field.name} className={`space-y-1.5 ${field.fullWidth ? "sm:col-span-2 col-span-1" : "col-span-1"}`}>
                <Label className="font-semibold text-xs text-slate-500 uppercase tracking-wider ml-1">{field.label}</Label>
                {field.type === "select" ? (
                  <Select onValueChange={(value) => handleChange(field.name, value)} defaultValue={(formData[field.name] as string) || ""}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.name === "videoUrl" ? (
                  /* Video upload UI */
                  <div className="space-y-2">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleVideoUpload(f)
                      }}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={videoUploading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 text-blue-600 text-sm font-medium hover:bg-blue-50 hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {videoUploading
                          ? <><Loader2 size={14} className="animate-spin" /> {isIntl ? "Uploading..." : "上传中..."}</>
                          : <><PlaySquare size={14} /> {isIntl ? "Select MP4 Video" : "选择 MP4 视频"}</>
                        }
                      </button>
                      {videoUploadProgress && (
                        <span className={`text-xs self-center font-medium ${videoUploadProgress.startsWith("✓") ? "text-green-600" : videoUploadProgress.startsWith("✗") ? "text-red-500" : "text-slate-500"}`}>
                          {videoUploadProgress}
                        </span>
                      )}
                    </div>
                    {typeof formData.videoUrl === 'string' && formData.videoUrl && (
                      <p className="text-[11px] text-slate-400 truncate">{isIntl ? "Selected:" : "已选:"} {formData.videoUrl.split("/").pop()}</p>
                    )}
                    <Input
                      type="text"
                      placeholder={isIntl ? "Or paste video URL directly" : "或直接粘贴视频直链 URL"}
                      value={(formData[field.name] as string) || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs placeholder:text-slate-400"
                    />
                  </div>
                ) : field.type === "file" ? (
                  /* File upload UI */
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      className="hidden"
                      id={`file-input-${field.name}`}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          handleChange(field.name, f.name)
                          const fileData = new FormData()
                          fileData.append('file', f)
                          handleChange(`${field.name}_file`, f)
                          // Generate preview for images
                          if (f.type.startsWith('image/')) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              handleChange(`${field.name}_preview`, event.target?.result as string)
                            }
                            reader.readAsDataURL(f)
                          } else {
                            handleChange(`${field.name}_preview`, '')
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`file-input-${field.name}`)?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-600 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-400 transition-all w-full justify-center"
                    >
                      <FileText size={14} /> {isIntl ? "Select File" : "选择文件"}
                    </button>
                    {(formData[`${field.name}_preview`] as string) ? (
                      <div className="space-y-1">
                        <p className="text-[11px] text-slate-400 truncate">{isIntl ? "Preview:" : "预览:"} {(() => { const v = formData[field.name]; return typeof v === 'string' ? v : (v as File).name })()}</p>
                        <img 
                          src={formData[`${field.name}_preview`] as string} 
                          alt={isIntl ? "Business License Preview" : "营业执照预览"}
                          className="max-h-48 w-full object-contain rounded-lg border border-slate-200 bg-slate-50"
                        />
                      </div>
                    ) : formData[field.name] ? (
                      <p className="text-[11px] text-slate-400 truncate">{isIntl ? "Selected:" : "已选:"} {(() => { const v = formData[field.name]; return typeof v === 'string' ? v : (v as File).name })()}</p>
                    ) : null}
                  </div>
                ) : (
                  <Input
                    required={!(field.name === "businessLicenseUrl")}
                    type={field.type}
                    placeholder={field.placeholder}
                    step={field.step}
                    value={(formData[field.name] as string) || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
                  />
                )}
              </div>
            ))}
            {config.showPublishOption && (
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-100 sm:col-span-2 col-span-1">
                <input
                  type="checkbox"
                  id="publishToPool"
                  checked={publishToPool}
                  onChange={(e) => setPublishToPool(e.target.checked)}
                  className="h-4 w-4 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                />
                <Label htmlFor="publishToPool" className="text-sm text-slate-500 font-medium cursor-pointer select-none">
                  {isIntl ? "Also publish to leads pool for other users to see" : "同时发布到线索池，让其他用户可见"}
                </Label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end items-center space-x-3 flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all"
            >
              {t("cancel")}
            </button>
            <button 
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-r ${config.gradient}`}
            >
              {(type === 'blogger' || type === 'new_blogger') ? t("submit") : t("confirm")}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

// ==========================================
// Modal: Status Selector
// ==========================================
function StatusSelectModal({ title, currentStatus, statuses, onClose, onConfirm }: {
  title: string
  currentStatus: string
  statuses: string[]
  onClose: () => void
  onConfirm: (newStatus: string) => void
}) {
  const [selected, setSelected] = useState(currentStatus)

  return (
    <ModalOverlay onClose={onClose}>
      <div 
        className="w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ border: '1px solid rgba(255,255,255,0.8)' }}
      >
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-r from-slate-800 to-slate-900 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <Settings className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {title}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-7 bg-white">
          <div className="space-y-2.5">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setSelected(s)}
                className={`w-full text-left px-5 py-4 rounded-xl text-sm transition-all flex items-center justify-between border-2 ${
                  selected === s
                    ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm shadow-blue-500/10"
                    : "border-slate-100 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-200 text-slate-600"
                }`}
              >
                <span className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${selected === s ? "bg-blue-500 animate-pulse" : "bg-slate-300"}`} />
                  <span className={selected === s ? "font-bold" : "font-medium"}>{s}</span>
                </span>
                {selected === s && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                    <Check size={14} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end items-center space-x-4">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all"
          >
            {t("cancel")}
          </button>
          <button 
            onClick={() => onConfirm(selected)} 
            disabled={selected === currentStatus}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-r from-blue-600 to-blue-500 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {t("confirm_update")}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
