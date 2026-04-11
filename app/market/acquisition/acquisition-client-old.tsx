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
import { LoginPrompt } from "@/components/market/login-prompt"
import { UserAvatarDropdown } from "@/components/market/user-avatar-dropdown"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type {
  AcquisitionBlogger,
  AcquisitionB2BLead,
  AcquisitionVCLead,
  AcquisitionAd,
  AcquisitionBootstrapData,
  UserMarketProfile,
  AdParticipation,
  BloggerCooperation,
} from "@/lib/market/acquisition-types"

type ViewMode = "task" | "influencer" | "merchant"
type InfluencerSubMode = 'pool' | 'personal' | 'cooperation'

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
              <p className="text-base font-bold text-slate-800">达人认证</p>
              <p className="text-sm text-slate-500 mt-0.5">{profile.isInfluencerVerified ? (profile.isRealInfluencer ? '金牌达人' : '已认证达人') : '未认证达人'}</p>
            </div>
          </div>
          {!profile.isInfluencerVerified && (
            <button 
              onClick={() => onVerify('influencer')}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              去认证
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
              <p className="text-base font-bold text-slate-800">商家认证</p>
              <p className="text-sm text-slate-500 mt-0.5">{profile.isMerchantVerified ? (profile.isRealMerchant ? '金牌商家' : '已认证商家') : '未认证商家'}</p>
            </div>
          </div>
          {!profile.isMerchantVerified && (
            <button 
              onClick={() => onVerify('merchant')}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:border-purple-300 hover:shadow-md transition-all duration-300"
            >
              去认证
            </button>
          )}
          {profile.isMerchantVerified && (
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Check size={16} className="text-purple-500" />
            </div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Balance Card */}
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
            <div className="text-sm text-slate-500 font-medium">当前余额</div>
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
            <div className="text-sm text-slate-500 font-medium">累计收益</div>
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
            <div className="text-sm text-slate-500 font-medium">已完成任务</div>
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
            <div className="text-sm text-slate-500 font-medium">真实用户进度</div>
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
            广告任务广场
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
                            <CheckCircle size={11} /> 已完成，奖励已到账
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
                          已观看
                        </div>
                      ) : (
                        <button 
                          onClick={() => router.push(`/ad/play/${ad.id}`)}
                          className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
                        >
                          立即观看
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
            已完成的任务
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
                <p className="text-slate-400 text-sm">完成广告任务后将显示在这里</p>
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
            申请提现
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// View: Influencer Mode (Blogger Profile & Pool)
// ==========================================
function InfluencerModeView({ profile, bloggerProfile, bloggers, allBloggers, subMode, onSetSubMode, onUpdateProfile, onAddBlogger, onDeleteBlogger, onVerify, cooperations, onApplyCooperation, onSendEmail }: {
  profile?: UserMarketProfile,
  bloggerProfile?: AcquisitionBlogger,
  bloggers: AcquisitionBlogger[],
  allBloggers: AcquisitionBlogger[],
  subMode: InfluencerSubMode,
  onSetSubMode: (mode: InfluencerSubMode) => void,
  onUpdateProfile: (blogger: AcquisitionBlogger) => void,
  onAddBlogger: () => void,
  onDeleteBlogger: (id: string) => void,
  onVerify: (type: "realName" | "influencer" | "merchant") => void,
  cooperations: BloggerCooperation[],
  onApplyCooperation: (blogger: AcquisitionBlogger, message: string) => Promise<{ success: boolean; message: string }>,
  onSendEmail: (blogger: AcquisitionBlogger, content: string) => Promise<{ success: boolean; message: string }>
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [cooperationModal, setCooperationModal] = useState<{blogger: AcquisitionBlogger} | null>(null)
  const [emailModal, setEmailModal] = useState<{blogger: AcquisitionBlogger, content: string} | null>(null)
  const [sending, setSending] = useState(false)
  const [applyMessage, setApplyMessage] = useState("")
  const [applyLoading, setApplyLoading] = useState(false)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)
  const pageSize = 10

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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center"><Users className="mr-2 h-5 w-5 text-blue-600" /> 个人达人页面</h3>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onSetSubMode('pool')}>
                <Globe className="mr-2 h-4 w-4" /> 进入博主池
              </Button>
              <Button variant="default" onClick={() => onSetSubMode('cooperation')} className="bg-blue-600">
                <Handshake className="mr-2 h-4 w-4" /> 合作列表
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
              <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><Users size={20} /></div>
              <div>
                <div className="text-sm text-muted-foreground">达人状态</div>
                <div className="font-bold">未认证达人</div>
              </div>
            </div>
            <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
              <div className="rounded-lg border bg-green-50 p-3 text-green-600"><DollarSign size={20} /></div>
              <div>
                <div className="text-sm text-muted-foreground">累计商单收益</div>
                <div className="text-2xl font-bold">¥0</div>
              </div>
            </div>
            <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
              <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><Wallet size={20} /></div>
              <div>
                <div className="text-sm text-muted-foreground">账户余额</div>
                <div className="text-2xl font-bold">¥{profile?.balance || "0.00"}</div>
              </div>
            </div>
            <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
              <div className="rounded-lg border bg-purple-50 p-3 text-purple-600"><Award size={20} /></div>
              <div>
                <div className="text-sm text-muted-foreground">合作单数</div>
                <div className="text-2xl font-bold">0</div>
              </div>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">开启达人认证，解锁商单管理功能</h3>
              <p className="text-muted-foreground mb-6">
                完成达人认证后，您可以录入和管理博主商单，跟踪合作进度，享受达人专属权益。
                              </p>
              <Button size="lg" onClick={() => onVerify('influencer')} className="bg-blue-600 hover:bg-blue-700">
                <Award className="mr-2 h-5 w-5" /> 立即认证达人
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center"><User className="mr-2 h-5 w-5 text-blue-600" /> 个人达人页面</h3>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onSetSubMode('pool')}>
              <Globe className="mr-2 h-4 w-4" /> 进入博主池
            </Button>
            <Button variant="default" onClick={() => onSetSubMode('cooperation')} className="bg-blue-600">
              <Handshake className="mr-2 h-4 w-4" /> 合作列表
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><Users size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">达人状态</div>
              <div className="font-bold text-sm">{!profile?.isInfluencerVerified ? '未认证达人' : profile?.isRealInfluencer ? '🔥 真实达人' : '认证达人'}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-green-50 p-3 text-green-600"><DollarSign size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">累计商单收益</div>
              <div className="text-2xl font-bold">¥{profile?.totalEarnings || "0"}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><Wallet size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">账户余额</div>
              <div className="text-2xl font-bold">¥{profile?.balance || "0.00"}</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-purple-50 p-3 text-purple-600"><Award size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">合作单数</div>
              <div className="text-2xl font-bold">0</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center"><Users className="mr-2 h-5 w-5 text-blue-600" /> 我的达人资料主页</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onAddBlogger}>
              <Plus className="mr-2 h-4 w-4" /> 新增博主账号
            </Button>
          </div>
        </div>

        {/* Personal Blogger Table */}
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
                <TableHead className="font-bold text-blue-900 py-4">达人昵称</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">主营平台</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">单条报价</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">分成比例</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">联系邮箱</TableHead>
                <TableHead className="text-right font-bold text-blue-900 py-4">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloggers.filter(b => b.status !== '已删除').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    尚未设置达人资料。点击右上角「新增博主账号」开始。
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
                        更新
                      </button>
                      <button 
                        onClick={() => onDeleteBlogger(blogger.id)}
                        className="text-red-500 hover:text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        删除
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
  if (subMode === 'pool') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center"><Globe className="mr-2 h-5 w-5 text-blue-600" /> 1000万博主增长引擎（博主池）</h3>
          <div className="flex space-x-2">
            <Button variant="default" onClick={() => onSetSubMode('personal')} className="bg-blue-600">
              <User className="mr-2 h-4 w-4" /> 个人博主管理
            </Button>
            <Button variant="outline" onClick={() => onSetSubMode('cooperation')}>
              <Handshake className="mr-2 h-4 w-4" /> 合作列表
            </Button>
          </div>
        </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="搜索博主昵称、平台、邮箱..."
          className="pl-10 py-6 text-lg rounded-xl shadow-sm border-blue-100" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Glassmorphism Table Card */}
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
              <TableHead className="font-bold text-blue-900 py-4">达人昵称</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">主营平台</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">单条报价</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">分成比例</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">联系邮箱</TableHead>
              <TableHead className="font-bold text-blue-900 py-4">状态</TableHead>
              <TableHead className="text-right font-bold text-blue-900 py-4">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBloggers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-10 w-10 mb-2 opacity-20" />
                    <p>暂无博主数据，快去「个人博主管理」录入吧！</p>
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
                        可用
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    {blogger.status === '已删除' ? (
                      <span className="text-slate-400 text-sm cursor-not-allowed">不可用</span>
                    ) : (
                      <div className="flex space-x-2 justify-end">
                        <button 
                          onClick={() => setCooperationModal({ blogger })}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          合作申请
                        </button>
                        <a 
                          href={getWebMailUrl(blogger.email)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all duration-200"
                        >
                          联系洽谈
                        </a>
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

  // 合作列表页面
  if (subMode === 'cooperation') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center"><Handshake className="mr-2 h-5 w-5 text-blue-600" /> 合作列表</h3>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onSetSubMode('personal')}>
              <User className="mr-2 h-4 w-4" /> 个人博主管理
            </Button>
            <Button variant="default" onClick={() => onSetSubMode('pool')} className="bg-blue-600">
              <Globe className="mr-2 h-4 w-4" /> 进入博主池
            </Button>
          </div>
        </div>

        {/* 合作列表 */}
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
                <TableHead className="font-bold text-blue-900 py-4">博主名称</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">平台</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">邮箱</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">状态</TableHead>
                <TableHead className="font-bold text-blue-900 py-4">创建时间</TableHead>
                <TableHead className="text-right font-bold text-blue-900 py-4">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cooperations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Handshake size={32} className="text-slate-300 mb-2" />
                      <p>暂无合作记录，快去博主池申请合作吧！</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                cooperations.map((coop, index) => (
                  <TableRow 
                    key={coop.id} 
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
                    <TableCell className="font-semibold text-slate-800 py-4">{coop.bloggerName}</TableCell>
                    <TableCell className="py-4">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          color: '#1e40af',
                          border: '1px solid rgba(59,130,246,0.2)'
                        }}
                      >
                        {coop.platform}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs py-4">{coop.email}</TableCell>
                    <TableCell className="py-4">
                      <StatusBadge status={coop.status} />
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm py-4">
                      {new Date(coop.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <button 
                        onClick={() => setEmailModal({ 
                          blogger: {
                            id: coop.bloggerId,
                            name: coop.bloggerName,
                            email: coop.email,
                            platform: coop.platform
                          },
                          content: `您好 ${coop.bloggerName}，关于我们之前的合作，我想进一步沟通详情...`
                        })}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200"
                      >
                        一键发送
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

  // 合作申请模态框
  {cooperationModal && (
    <ModalOverlay onClose={() => {
      setCooperationModal(null)
      setApplyMessage('')
      setApplySuccess(null)
    }}>
      <div 
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(224,234,255,0.8)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">合作申请</h3>
          <button 
            onClick={() => {
              setCooperationModal(null)
              setApplyMessage('')
              setApplySuccess(null)
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="blogger-name">博主名称</Label>
            <Input 
              id="blogger-name" 
              value={cooperationModal.blogger.name} 
              disabled 
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="blogger-platform">平台</Label>
            <Input 
              id="blogger-platform" 
              value={cooperationModal.blogger.platform} 
              disabled 
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="apply-message">合作留言</Label>
            <Textarea 
              id="apply-message" 
              placeholder="请输入您的合作意向和具体需求..."
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              className="mt-1 min-h-[120px]"
            />
          </div>
          
          {applySuccess && (
            <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">
              {applySuccess}
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button 
              onClick={() => {
                setCooperationModal(null)
                setApplyMessage('')
                setApplySuccess(null)
              }}
              variant="outline"
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              onClick={async () => {
                if (!applyMessage.trim()) {
                  alert('请输入合作留言')
                  return
                }
                
                setApplyLoading(true)
                try {
                  const result = await onApplyCooperation(cooperationModal.blogger, applyMessage)
                  setApplySuccess(result.message)
                  if (result.success) {
                    setTimeout(() => {
                      setCooperationModal(null)
                      setApplyMessage('')
                      setApplySuccess(null)
                    }, 2000)
                  }
                } catch (error) {
                  setApplySuccess('申请失败，请稍后重试')
                } finally {
                  setApplyLoading(false)
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={applyLoading}
            >
              {applyLoading ? '提交中...' : '提交申请'}
            </Button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )}

  // 邮件发送模态框
  {emailModal && (
    <ModalOverlay onClose={() => setEmailModal(null)}>
      <div 
        className="w-full max-w-2xl rounded-2xl p-6 space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(224,234,255,0.8)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">一键发送邮件</h3>
          <button 
            onClick={() => setEmailModal(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email-to">收件人</Label>
            <Input 
              id="email-to" 
              value={emailModal.blogger.email} 
              disabled 
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="email-content">邮件内容</Label>
            <Textarea 
              id="email-content" 
              value={emailModal.content}
              onChange={(e) => setEmailModal({ ...emailModal, content: e.target.value })}
              className="mt-1 min-h-[200px]"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={() => setEmailModal(null)}
              variant="outline"
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              onClick={async () => {
                if (!emailModal.content.trim()) {
                  alert('请输入邮件内容')
                  return
                }
                
                setSending(true)
                try {
                  const result = await onSendEmail(emailModal.blogger, emailModal.content)
                  if (result.success) {
                    alert('邮件发送成功')
                    setEmailModal(null)
                  } else {
                    alert('邮件发送失败：' + result.message)
                  }
                } catch (error) {
                  alert('邮件发送失败，请稍后重试')
                } finally {
                  setSending(false)
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={sending}
            >
              {sending ? '发送中...' : '发送邮件'}
            </Button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )}

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
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("ads")
  const [showCollectMenu, setShowCollectMenu] = useState(false)

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
              <div className="text-sm text-muted-foreground">商家身份</div>
              <div className="font-bold">未认证商家</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><BarChart3 size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">累计投放消费</div>
              <div className="text-2xl font-bold">¥0</div>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
            <div className="rounded-lg border bg-green-50 p-3 text-green-600"><Network size={20} /></div>
            <div>
              <div className="text-sm text-muted-foreground">线索转化率</div>
              <div className="text-2xl font-bold">0%</div>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">开启商家认证，解锁企业级获客功能</h3>
            <p className="text-muted-foreground mb-6">
              完成商家认证后，您可以发布广告任务、管理企业线索、对接投资机构，享受商家专属权益。
            </p>
            <Button size="lg" onClick={() => onVerify('merchant')} className="bg-purple-600 hover:bg-purple-700">
              <Building2 className="mr-2 h-5 w-5" /> 立即认证商家
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              认证后即可使用广告发布、线索管理、VC对接等功能。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
          <div className="rounded-lg border bg-purple-50 p-3 text-purple-600"><Building2 size={20} /></div>
          <div>
            <div className="text-sm text-muted-foreground">商家身份</div>
            <div className="font-bold">{!profile?.isMerchantVerified ? '未认证商家' : profile?.isRealMerchant ? '💎 真实商家 (享补贴)' : '认证商家'}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
          <div className="rounded-lg border bg-blue-50 p-3 text-blue-600"><BarChart3 size={20} /></div>
          <div>
            <div className="text-sm text-muted-foreground">累计投放消费</div>
            <div className="text-2xl font-bold">¥50.00</div>
          </div>
        </div>
        <div className="rounded-xl border bg-background p-5 flex items-center space-x-4">
          <div className="rounded-lg border bg-green-50 p-3 text-green-600"><Network size={20} /></div>
          <div>
            <div className="text-sm text-muted-foreground">线索转化率</div>
            <div className="text-2xl font-bold">12.5%</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div 
          className="grid w-full grid-cols-4 mb-6 p-1.5 rounded-2xl gap-1"
          style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(203,213,225,0.5)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
          }}
        >
          <button 
            onClick={() => setActiveTab("ads")}
            className={`relative rounded-xl text-sm font-medium transition-all duration-300 py-2.5 overflow-hidden ${
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
            我的投放广告
          </button>
          <button 
            onClick={() => setActiveTab("leads")}
            className={`relative rounded-xl text-sm font-medium transition-all duration-300 py-2.5 overflow-hidden ${
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
            企业线索 (B2B)
          </button>
          <button 
            onClick={() => setActiveTab("vc")}
            className={`relative rounded-xl text-sm font-medium transition-all duration-300 py-2.5 overflow-hidden ${
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
            投融资对接 (VC)
          </button>
          <div className="relative group">
            <button 
              className="relative rounded-xl text-sm font-medium transition-all duration-300 py-2.5 px-3 w-full
                text-slate-600 hover:text-slate-800 hover:bg-white/50"
              onClick={() => setShowCollectMenu(v => !v)}
            >
              线索采集 ▾
            </button>
            {showCollectMenu && (
              <div className="absolute top-full left-0 mt-1 w-36 rounded-xl shadow-lg bg-white border border-slate-100 overflow-hidden z-50">
                <button onClick={() => { router.push('/market/collect-tasks'); setShowCollectMenu(false) }} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700">博主采集</button>
                <button onClick={() => { router.push('/market/enterprise-collect-tasks'); setShowCollectMenu(false) }} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-purple-50 hover:text-purple-700">企业采集</button>
                <button onClick={() => { router.push('/market/vc-collect-tasks'); setShowCollectMenu(false) }} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">VC 采集</button>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="ads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">发布 Ad-to-Earn 广告</h4>
            <Button size="sm" onClick={onAddAd} className="bg-blue-600"><Plus className="mr-2 h-4 w-4" /> 发布广告</Button>
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
                  <TableHead className="font-bold text-blue-900 py-4">品牌/名称</TableHead>
                  <TableHead className="font-bold text-blue-900 py-4">类型</TableHead>
                  <TableHead className="font-bold text-blue-900 py-4">要求时长</TableHead>
                  <TableHead className="font-bold text-blue-900 py-4">观看次数</TableHead>
                  <TableHead className="font-bold text-blue-900 py-4">状态</TableHead>
                  <TableHead className="text-right font-bold text-blue-900 py-4">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">暂无发布的广告</TableCell></TableRow>
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
                          设置
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
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                我跟进的客户
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">{followLeads.length}</Badge>
              </h4>
              <Button size="sm" onClick={onAddB2BFollow} className="bg-purple-600"><Plus className="mr-2 h-4 w-4" /> 录入客户</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {followLeads.length === 0 ? (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm bg-slate-50/30">
                  暂无跟进的客户，点击「录入客户」添加。
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
                        <span className="text-xs text-slate-400 mr-2">预估价值:</span>
                        <span className="text-emerald-600 font-bold font-mono">¥{lead.estValue}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateStatus('b2b', lead)}
                        className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-all duration-300"
                      >
                        更新进度
                      </button>
                      <a 
                        href={`mailto:${lead.email}?subject=来自 mornbusiness 的合作邀请`}
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
                我发布的需求
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">{publishLeads.length}</Badge>
              </h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onViewPublicPool} className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50">
                  <Globe className="mr-2 h-4 w-4" /> 线索池
                </Button>
                <Button size="sm" variant="outline" onClick={onViewApplications} className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50">
                  <Handshake className="mr-2 h-4 w-4" /> 收到的申请
                </Button>
                <Button size="sm" onClick={onAddB2BPublish} className="bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/20">
                  <Plus className="mr-2 h-4 w-4" /> 发布需求
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {publishLeads.length === 0 ? (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm bg-slate-50/30">
                  暂无发布的需求，点击「发布需求」添加。
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
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">已上线</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-bold">待发布</span>
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
                          <span className="text-xs text-slate-400 mr-2">预估价值:</span>
                          <span className="text-emerald-600 font-bold font-mono">¥{lead.estValue}</span>
                        </div>
                        {lead.cooperationCount! > 0 && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{lead.cooperationCount} 个合作申请</span>
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
                        {lead.isPublic ? "下架" : "上架发布"}
                      </button>
                      <button
                        onClick={() => requestDelete(lead.id, lead.name)}
                        className="p-2 rounded-xl bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 border border-red-100 transition-all duration-300"
                        title="从页面移除"
                      >
                        <X size={16} />
                      </button>
                      <a 
                        href={`mailto:${lead.email}?subject=来自 mornbusiness 的合作邀请`}
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
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                我跟进的 VC 机构
              </h4>
              <Button size="sm" onClick={onAddVCFollow} className="bg-emerald-600"><Plus className="mr-2 h-4 w-4" /> 录入 VC 机构</Button>
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
                    <TableHead className="font-bold text-emerald-900 py-4">机构名称</TableHead>
                    <TableHead className="font-bold text-emerald-900 py-4">关注领域</TableHead>
                    <TableHead className="font-bold text-emerald-900 py-4">对接阶段</TableHead>
                    <TableHead className="text-right font-bold text-emerald-900 py-4">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vcFollowLeads.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-500">暂无跟进的 VC 机构</TableCell></TableRow>
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
                            推进进度
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
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                我发布的融资需求
              </h4>
              <Button size="sm" onClick={onAddVCPublish} className="bg-emerald-600"><Plus className="mr-2 h-4 w-4" /> 发布融资需求</Button>
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
                    <TableHead className="font-bold text-emerald-900 py-4">企业名称</TableHead>
                    <TableHead className="font-bold text-emerald-900 py-4">融资金额 / 阶段</TableHead>
                    <TableHead className="font-bold text-emerald-900 py-4">状态</TableHead>
                    <TableHead className="text-right font-bold text-emerald-900 py-4">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vcPublishLeads.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-500">暂无发布的融资需求</TableCell></TableRow>
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
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">已发布</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200">未发布</span>
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
                              {vc.isPublic ? '下架' : '上架发布'}
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
                <h3 className="text-lg font-bold text-white">确认删除？</h3>
                <p className="text-white/70 text-xs mt-1">
                  将从页面移除「{confirmDeleteName}」，数据库不受影响
                </p>
              </div>
            </div>
            <div className="p-6 flex gap-3">
              <button
                onClick={() => { setConfirmDeleteId(null); setConfirmDeleteName("") }}
                className="flex-1 h-11 rounded-full border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                否，取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold shadow-lg shadow-red-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <X size={15} /> 是，删除
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode = (searchParams.get("mode") as ViewMode) || "task";
  
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [bloggers, setBloggers] = useState<AcquisitionBlogger[]>([]);
  const [allBloggers, setAllBloggers] = useState<AcquisitionBlogger[]>([]);
  const [b2bLeads, setB2bLeads] = useState<AcquisitionB2BLead[]>([]);
  const [vcFollowLeads, setVcFollowLeads] = useState<AcquisitionVCLead[]>([]);
  const [vcPublishLeads, setVcPublishLeads] = useState<AcquisitionVCLead[]>([]);
  const [ads, setAds] = useState<AcquisitionAd[]>([]);
  const [profile, setProfile] = useState<UserMarketProfile | undefined>();
  const [bloggerProfile, setBloggerProfile] = useState<AcquisitionBlogger | undefined>();
  const [influencerSubMode, setInfluencerSubMode] = useState<InfluencerSubMode>('pool');
  const [participations, setParticipations] = useState<AdParticipation[]>([]);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  // Modal states
  const [formModal, setFormModal] = useState<{ isOpen: boolean; type: "blogger" | "b2b" | "b2b_follow" | "b2b_publish" | "vc_follow" | "vc_publish" | "ad" | "realName" | "new_blogger" | "influencer" | "merchant" | null; initialData?: any }>({ isOpen: false, type: null });
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; title: string; currentStatus: string; statuses: string[]; onConfirm: (s: string) => void } | null>(null);
  const [cooperations, setCooperations] = useState<BloggerCooperation[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  }, []);

  const fetchBootstrap = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/market/admin/acquisition", { credentials: "include" });
      console.log("[DEBUG] API response status:", response.status, response.statusText);
      const json = await response.json();
      console.log("[DEBUG] API response:", json);
      if (!json.success) throw new Error(json.error || "加载数据失败");
      
      const data: AcquisitionBootstrapData = json.data;
      console.log("[DEBUG] Parsed data:", data);
      console.log("[DEBUG] Profile:", data.profile);
      setBloggers(data.bloggers);
      setAllBloggers(data.allBloggers || []);
      setB2bLeads(data.b2bLeads);
      setVcFollowLeads(data.vcFollowLeads || []);
      setVcPublishLeads(data.vcPublishLeads || []);
      setAds(data.ads);
      setProfile(data.profile);
      setBloggerProfile(data.bloggerProfile);
      setParticipations(data.participations || []);
      setCooperations(data.cooperations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApplyCooperation = async (blogger: AcquisitionBlogger, message: string) => {
    if (!ensureLoggedIn()) return { success: false, message: '请先登录' };
    try {
      const response = await fetch('/api/market/acquisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'apply_cooperation',
          bloggerId: blogger.id, 
          message 
        })
      });
      const result = await response.json();
      if (result.success) {
        showToast('✅ 合作申请已提交');
        fetchBootstrap(); // 刷新数据
      }
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('Failed to apply for cooperation:', error);
      return { success: false, message: '申请失败，请稍后重试' };
    }
  };

  const handleSendEmail = async (blogger: AcquisitionBlogger, content: string) => {
    if (!ensureLoggedIn()) return { success: false, message: '请先登录' };
    try {
      const response = await fetch('/api/market/acquisition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'send_email',
          bloggerId: blogger.id, 
          content 
        })
      });
      const result = await response.json();
      if (result.success) {
        showToast('✅ 邮件发送成功');
      }
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, message: '邮件发送失败，请稍后重试' };
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  // 监听用户登录状态变化（localStorage 中的 market_user）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'market_user') {
        console.log('[DEBUG] market_user changed, refetching data')
        fetchBootstrap()
      }
    }

    // 添加 storage 事件监听器
    window.addEventListener('storage', handleStorageChange)
    
    // 检查当前是否有用户登录（从 localStorage）
    const userStr = localStorage.getItem('market_user')
    if (userStr && !profile) {
      console.log('[DEBUG] Found market_user in localStorage, refetching data')
      fetchBootstrap()
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchBootstrap, profile])

  // 调试：监听 profile 变化
  useEffect(() => {
    console.log('[DEBUG] Profile state changed:', profile)
  }, [profile])

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
      if (!json.success) throw new Error(json.error || "操作失败")
      await fetchBootstrap() // Refresh data
      return json.result
    } catch (err) {
      showToast(`❌ ${err instanceof Error ? err.message : "操作失败"}`)
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
    if (result) showToast(`✅ 已开始任务：${ad.brand}`)
  }

  const handleComplete = async (p: AdParticipation) => {
    if (!ensureLoggedIn()) return
    const result = await postAction("complete_ad_task", { participationId: p.id })
    if (result) showToast(`🎉 任务完成！获得收益：¥${p.rewardEarned}`)
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
            showToast("✅ 达人认证成功！")
            fetchBootstrap() // 刷新数据
          } else {
            showToast(`❌ ${result.message || "认证失败"}`)
          }
        } catch (err) {
          showToast("❌ 网络错误，请重试")
        }
      } else if (type === "merchant") {
        // 调用商家认证API
        try {
          const response = await fetch("/api/profile/merchant-apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          if (result.ok) {
            showToast("✅ 商家认证成功！")
            fetchBootstrap() // 刷新数据
          } else {
            showToast(`❌ ${result.message || "认证失败"}`)
          }
        } catch (err) {
          showToast("❌ 网络错误，请重试")
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
      ad: { title: `设置广告「${item.brand}」`, statuses: ["投放中", "已暂停", "已下架"], action: "update_ad" },
      b2b: { title: `更新线索「${item.name}」进度`, statuses: ["初步接触", "跟进中", "合同拟定", "已转化", "已流失"], action: "update_b2b_status" },
      vc: { title: `推进「${item.name}」阶段`, statuses: ["待联系", "初步接触", "深度沟通(Pitch)", "尽职调查", "已投资", "已拒绝"], action: "update_vc_status" },
      blogger: { title: `更新商单「${item.name}」状态`, statuses: ["未联系", "已联系", "谈判中", "已合作", "已拒绝"], action: "update_blogger_status" },
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
          showToast(`✅ 已更新为：${newStatus}`)
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
          <div className="text-destructive text-lg font-medium">加载失败: {error}</div>
          <Button onClick={fetchBootstrap}>重试</Button>
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
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center tracking-tight">
            <span className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-2 rounded-xl mr-3 shadow-lg shadow-blue-500/25">
              <Target size={28} />
            </span>
            <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              获客系统 · 用户端 (V2)
            </span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">统一用户体系 · 数据安全隔离 · 三大业务模式</p>
        </div>
        
        {/* Mode Switch Buttons */}
        <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-sm">
          {[
            { mode: 'task' as ViewMode, label: '任务模式', gradient: 'from-blue-500 to-cyan-500' },
            { mode: 'influencer' as ViewMode, label: '达人模式', gradient: 'from-purple-500 to-pink-500' },
            { mode: 'merchant' as ViewMode, label: '商家模式', gradient: 'from-emerald-500 to-teal-500' },
          ].map(({ mode, label, gradient }) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden
                ${viewMode === mode 
                  ? 'text-white shadow-lg' 
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/80'
                }`}
            >
              {viewMode === mode && (
                <span className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-100`} />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="icon" className="rounded-full relative">
            <Bell size={18} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
          </Button>
          {isLoggedIn ? (
            <div className="pl-2 border-l">
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
                    // 优先使用 localStorage 中的 email
                    if (storedUser?.email) return storedUser.email;
                    // 其次使用 profile.email
                    if (profile?.email) return profile.email;
                    // 最后返回空字符串，不显示ID
                    return '';
                  })()
                }}
              />
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsLoginPromptOpen(true)}>
              登录
            </Button>
          )}
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
            cooperations={cooperations}
            onApplyCooperation={handleApplyCooperation}
            onSendEmail={handleSendEmail}
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
            <span className="text-sm font-medium">处理中...</span>
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
  onSubmit: (data: Record<string, string>) => void
  initialData?: Record<string, string>
}) {
  console.log("[DEBUG] AddFormModal rendering with type:", type);
  const [formData, setFormData] = useState<Record<string, string>>(initialData || {})
  const [publishToPool, setPublishToPool] = useState(false)
  // 视频上传状态
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoUploadProgress, setVideoUploadProgress] = useState("")
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (name: string, value: string) => setFormData((prev) => ({ ...prev, [name]: value }))

  const handleVideoUpload = async (file: File) => {
    if (!file) return
    setVideoUploading(true)
    setVideoUploadProgress("上传中...")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload/video", { method: "POST", credentials: "include", body: fd })
      const json = await res.json()
      if (json.ok && json.data?.videoUrl) {
        handleChange("videoUrl", json.data.videoUrl)
        setVideoUploadProgress("✓ 上传成功")
      } else {
        setVideoUploadProgress(`✗ ${json.message || "上传失败"}`)
      }
    } catch {
      setVideoUploadProgress("✗ 网络错误，请重试")
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
      title: "达人资料设置",
      icon: <Users className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-500",
      fields: [
        { name: "name", label: "达人昵称", type: "text", placeholder: "输入你的账号名称" },
        { name: "platform", label: "主营平台", type: "text", placeholder: "选择你主要活跃的平台（抖音 / 小红书 / B 站 / 快手 / 视频号）" },
        { name: "email", label: "联系邮箱", type: "email", placeholder: "用于接收广告合作邀请" },
        { name: "followers", label: "粉丝总量", type: "text", placeholder: "输入你的当前粉丝数（例：10000）" },
        { name: "cost", label: "单条广告报价（元）", type: "text", placeholder: "输入你期望的单条广告基础费用" },
        { name: "commission", label: "期望分成比例（%）", type: "text", placeholder: "输入你期望的利润分成比例" },
      ],
    },
    new_blogger: {
      title: "新增博主账号",
      icon: <Plus className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-500",
      fields: [
        { name: "name", label: "账号名称", type: "text", placeholder: "输入新账号名称" },
        { name: "platform", label: "所属平台", type: "text", placeholder: "如：抖音、小红书等" },
        { name: "email", label: "联系邮箱", type: "email", placeholder: "用于接收广告合作邀请" },
        { name: "followers", label: "粉丝数量", type: "text", placeholder: "输入该账号的粉丝数" },
        { name: "cost", label: "单条报价（元）", type: "text", placeholder: "该账号的广告报价" },
        { name: "commission", label: "期望分成（%）", type: "text", placeholder: "期望的分成比例" },
      ],
    },
    b2b_follow: {
      title: "录入跟进的客户",
      icon: <Building2 className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      fields: [
        { name: "name", label: "企业名称", type: "text", placeholder: "如：深圳XX科技公司" },
        { name: "region", label: "所属区域", type: "text", placeholder: "如：深圳/北京" },
        { name: "contact", label: "联系人及职务", type: "text", placeholder: "如：王总(CTO)" },
        { name: "email", label: "联系邮箱", type: "email", placeholder: "如：wang@company.com" },
        { name: "estValue", label: "预估客单价", type: "text", placeholder: "如：¥30,000" },
      ],
    },
    b2b_publish: {
      title: "发布合作需求",
      icon: <Globe className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      wide: true,
      fields: [
        { name: "name", label: "需求标题", type: "text", placeholder: "如：寻找深圳地区数码产品供应商", fullWidth: true },
        { name: "region", label: "所属区域", type: "text", placeholder: "如：深圳/北京" },
        { name: "contact", label: "联系人及职务", type: "text", placeholder: "如：王总(CTO)" },
        { name: "email", label: "联系邮箱", type: "email", placeholder: "如：wang@company.com" },
        { name: "estValue", label: "预估合作价值", type: "text", placeholder: "如：¥30,000" },
        { name: "description", label: "需求描述", type: "text", placeholder: "详细描述您的合作需求...", fullWidth: true },
      ],
    },
    b2b: {
      title: "手工录入企业线索",
      icon: <Building2 className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      fields: [
        { name: "name", label: "企业名称", type: "text", placeholder: "如：深圳XX科技公司" },
        { name: "region", label: "所属区域", type: "text", placeholder: "如：深圳/北京" },
        { name: "contact", label: "联系人及职务", type: "text", placeholder: "如：王总(CTO)" },
        { name: "email", label: "联系邮箱", type: "email", placeholder: "如：wang@company.com" },
        { name: "estValue", label: "预估客单价", type: "text", placeholder: "如：¥30,000" },
      ],
    },
    vc: {
      title: "添加投资机构线索",
      icon: <Landmark className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-500",
      fields: [
        { name: "name", label: "机构名称", type: "text", placeholder: "如：高瓴创投" },
        { name: "region", label: "区域", type: "text", placeholder: "如：北京" },
        { name: "contact", label: "联系人", type: "text", placeholder: "如：李经理" },
        { name: "email", label: "联系邮箱", type: "email", placeholder: "如：li@fund.com" },
        { name: "focus", label: "关注领域", type: "text", placeholder: "如：AI/SaaS" },
      ],
    },
    vc_follow: {
      title: "录入 VC 机构",
      icon: <Landmark className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-500",
      fields: [
        { name: "name", label: "机构名称", type: "text", placeholder: "如：高瓴创投" },
        { name: "region", label: "区域", type: "text", placeholder: "如：北京" },
        { name: "contact", label: "联系人", type: "text", placeholder: "如：李经理" },
        { name: "email", label: "联系邮箱", type: "email", placeholder: "如：li@fund.com" },
        { name: "focus", label: "关注领域", type: "text", placeholder: "如：AI/SaaS" },
      ],
    },
    vc_publish: {
      title: "发布融资需求",
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-500",
      wide: true,
      fields: [
        { name: "name", label: "企业名称", type: "text", placeholder: "如：我的科技公司", fullWidth: true },
        { name: "region", label: "区域", type: "text", placeholder: "如：北京" },
        { name: "contact", label: "联系人", type: "text", placeholder: "如：张总" },
        { name: "email", label: "联系邮箱", type: "email", placeholder: "如：zhang@company.com" },
        { name: "focus", label: "行业领域", type: "text", placeholder: "如：AI/SaaS" },
        { name: "fundingAmount", label: "融资金额", type: "text", placeholder: "如：1000万" },
        { name: "fundingStage", label: "融资阶段", type: "text", placeholder: "如：Pre-A轮" },
        { name: "description", label: "需求描述", type: "text", placeholder: "详细描述融资需求...", fullWidth: true },
      ],
    },
    ad: {
      title: "发布新广告位",
      icon: <PlaySquare className="h-5 w-5" />,
      gradient: "from-blue-500 to-cyan-500",
      fields: [
        { name: "brand", label: "广告品牌", type: "text", placeholder: "如：某出行App" },
        { name: "type", label: "广告类型", type: "select", options: ["视频广告", "互动广告", "横幅图片"] },
        { name: "duration", label: "要求时长", type: "text", placeholder: "如：30s" },
        { name: "reward", label: "奖励金额", type: "text", placeholder: "如：0.5 RMB" },
        { name: "videoUrl", label: "视频链接（可选）", type: "text", placeholder: "粘贴视频直链 URL，如 https://..." },
      ],
    },
    influencer: {
      title: "达人认证申请",
      icon: <Award className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-500",
      wide: true,
      fields: [
        { name: "platform", label: "主营平台", type: "text", placeholder: "如：抖音 / 小红书 / B站 / 快手" },
        { name: "platformAccount", label: "平台账号", type: "text", placeholder: "输入您的平台账号名" },
        { name: "platformHomeUrl", label: "主页链接", type: "text", placeholder: "输入您的主页链接（可选）", fullWidth: true },
        { name: "followers", label: "粉丝总量", type: "text", placeholder: "如：10000" },
        { name: "cost", label: "单条广告报价（元）", type: "text", placeholder: "如：1000" },
        { name: "commission", label: "期望分成比例（%）", type: "text", placeholder: "如：20", fullWidth: true },
      ],
    },
    merchant: {
      title: "商家认证申请",
      icon: <Building2 className="h-5 w-5" />,
      gradient: "from-emerald-500 to-teal-500",
      wide: true,
      fields: [
        { name: "companyName", label: "公司名称", type: "text", placeholder: "输入您的公司全称", fullWidth: true },
        { name: "creditCode", label: "统一社会信用代码", type: "text", placeholder: "输入18位统一社会信用代码", fullWidth: true },
        { name: "businessLicenseUrl", label: "营业执照链接", type: "text", placeholder: "上传营业执照后的链接（可选）", fullWidth: true },
        { name: "brandName", label: "品牌名称", type: "text", placeholder: "输入您的品牌名称" },
        { name: "contactPerson", label: "联系人", type: "text", placeholder: "输入联系人姓名" },
        { name: "contactPhone", label: "联系电话", type: "text", placeholder: "输入联系电话" },
        { name: "industry", label: "所属行业", type: "text", placeholder: "如：美妆 / 食品 / 数码" },
      ],
    },
  }

  const config = configs[type]
  if (!config) return null

  return (
    <ModalOverlay onClose={onClose}>
      <div 
        className={`w-full ${config.wide ? "max-w-2xl" : "max-w-md"} bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
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
        <form onSubmit={handleSubmitWithPublish} className="bg-white">
          <div className={`grid ${config.wide ? "grid-cols-2" : "grid-cols-1"} gap-x-6 gap-y-5 p-7`}>
            {config.fields.map((field) => (
              <div key={field.name} className={`space-y-1.5 ${field.fullWidth ? "col-span-2" : "col-span-1"}`}>
                <Label className="font-semibold text-xs text-slate-500 uppercase tracking-wider ml-1">{field.label}</Label>
                {field.type === "select" ? (
                  <Select onValueChange={(value) => handleChange(field.name, value)} defaultValue={formData[field.name] || ""}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.name === "videoUrl" ? (
                  /* 视频上传专用 UI */
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={videoUploading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 text-blue-600 text-sm font-medium hover:bg-blue-50 hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {videoUploading
                          ? <><Loader2 size={14} className="animate-spin" /> 上传中...</>
                          : <><PlaySquare size={14} /> 选择 MP4 视频</>
                        }
                      </button>
                      {videoUploadProgress && (
                        <span className={`text-xs self-center font-medium ${videoUploadProgress.startsWith("✓") ? "text-green-600" : videoUploadProgress.startsWith("✗") ? "text-red-500" : "text-slate-500"}`}>
                          {videoUploadProgress}
                        </span>
                      )}
                    </div>
                    {formData.videoUrl && (
                      <p className="text-[11px] text-slate-400 truncate">已选: {formData.videoUrl.split("/").pop()}</p>
                    )}
                    {/* 也允许手动粘贴 URL */}
                    <Input
                      type="text"
                      placeholder="或直接粘贴视频直链 URL"
                      value={formData[field.name] || ""}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs placeholder:text-slate-400"
                    />
                  </div>
                ) : (
                  <Input
                    required
                    type={field.type}
                    placeholder={field.placeholder}
                    step={field.step}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-400 transition-all"
                  />
                )}
              </div>
            ))}
            {config.showPublishOption && (
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-100 col-span-2">
                <input
                  type="checkbox"
                  id="publishToPool"
                  checked={publishToPool}
                  onChange={(e) => setPublishToPool(e.target.checked)}
                  className="h-4 w-4 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                />
                <Label htmlFor="publishToPool" className="text-sm text-slate-500 font-medium cursor-pointer select-none">
                  同时发布到线索池，让其他用户可见
                </Label>
              </div>
            )}
          </div>

          {/* Footer with subtle contrast */}
          <div className="px-7 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end items-center space-x-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all"
            >
              取消
            </button>
            <button 
              type="submit"
              className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-r ${config.gradient}`}
            >
              {(type === 'blogger' || type === 'new_blogger') ? '提交资料' : '确认保存'}
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
            取消
          </button>
          <button 
            onClick={() => onConfirm(selected)} 
            disabled={selected === currentStatus}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-r from-blue-600 to-blue-500 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
          >
            确认更新
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
