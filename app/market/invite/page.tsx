"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Copy, Check, Users, Gift, TrendingUp, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const isIntl = (process.env.NEXT_PUBLIC_SITE_REGION || "cn").toLowerCase() !== "cn"

const T = {
  back:         isIntl ? "Back"                          : "返回",
  title:        isIntl ? "Invite Friends"                : "邀请好友",
  heroTitle:    isIntl ? "Invite Friends, Get Rewards"   : "邀请好友，获得折扣券",
  heroSub:      isIntl ? "When your friend registers via your link, you'll receive a discount coupon for AI membership" : "好友通过你的链接注册后，你将获得 AI 会员折扣券奖励",
  myLink:       isIntl ? "My Invite Link"                : "我的邀请链接",
  myCode:       isIntl ? "My Invite Code"                : "我的邀请码",
  copy:         isIntl ? "Copy"                          : "复制",
  copied:       isIntl ? "Copied"                        : "已复制",
  share:        isIntl ? "Share"                         : "分享",
  loginFirst:   isIntl ? "Please log in to view your invite link" : "请先登录后查看邀请链接",
  generating:   isIntl ? "Loading..."                    : "加载中...",
  clicks:       isIntl ? "Link Clicks"                   : "链接点击",
  invited:      isIntl ? "Invited"                       : "成功邀请",
  activated:    isIntl ? "Activated"                     : "已激活",
  myCoupons:    isIntl ? "My Discount Coupons"           : "我的折扣券",
  couponSub:    isIntl ? "Use on AI membership purchase" : "可用于 AI 会员充值",
  discount:     isIntl ? "off"                           : "折",
  uses:         isIntl ? "uses left"                     : "次可用",
  expires:      isIntl ? "Expires"                       : "到期",
  expired:      isIntl ? "Expired"                       : "已过期",
  usedUp:       isIntl ? "Used up"                       : "已用完",
  noCoupons:    isIntl ? "No coupons yet. Invite friends to earn discount coupons!" : "暂无折扣券，邀请好友后可获得折扣券奖励",
  rules:        isIntl ? "Rules"                         : "活动规则",
  rule1:        isIntl ? "Share your unique invite link with friends" : "分享你的专属邀请链接给好友",
  rule2:        isIntl ? "Friend registers via your link, binding the invite relationship" : "好友通过链接注册后，双方绑定邀请关系",
  rule3:        isIntl ? "Admin reviews and issues discount coupons to inviters" : "管理员审核后向邀请人发放折扣券",
  rule4:        isIntl ? "Use discount coupon when purchasing AI membership" : "折扣券可在购买 AI 会员时使用",
  rule5:        isIntl ? "Each account can only be invited once" : "每个账号仅可被邀请一次，不可重复绑定",
}

export default function InvitePage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/market/invite", { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.ok) setData(j.data) })
      .finally(() => setLoading(false))
  }, [])

  const handleCopyLink = async () => {
    if (!data?.shareUrl) return
    await navigator.clipboard.writeText(data.shareUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCodeCopied(code); setTimeout(() => setCodeCopied(null), 2000)
  }

  const handleShare = async () => {
    if (!data?.shareUrl) return
    if (navigator.share) {
      await navigator.share({ title: T.title, url: data.shareUrl }).catch(() => {})
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-300/15 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} /> {T.back}
          </button>
          <span className="font-semibold text-slate-800">{T.title}</span>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-xl font-bold mb-1">{T.heroTitle}</h1>
          <p className="text-white/80 text-sm">{T.heroSub}</p>
          <div className="mt-4 bg-white/15 rounded-xl p-4 flex items-center gap-3">
            <Gift size={24} className="text-yellow-300 flex-shrink-0" />
            <div>
              <div className="font-bold">{isIntl ? "Discount Coupon" : "折扣券奖励"}</div>
              <div className="text-xs text-white/70 mt-0.5">{isIntl ? "Issued by admin after friend registers" : "好友注册后由管理员审核发放"}</div>
            </div>
          </div>
        </div>

        {/* 邀请链接 */}
        <Card className="bg-white/80 backdrop-blur border-white/60">
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold text-slate-800">{T.myLink}</h2>
            {loading ? (
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ) : data?.shareUrl ? (
              <>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 font-mono truncate">
                    {data.shareUrl}
                  </div>
                  <Button onClick={handleCopyLink} variant="outline" className="rounded-xl px-3 shrink-0">
                    {copied ? <><Check size={14} className="mr-1 text-green-500" />{T.copied}</> : <><Copy size={14} className="mr-1" />{T.copy}</>}
                  </Button>
                  <Button onClick={handleShare} variant="outline" className="rounded-xl px-3 shrink-0">
                    <Share2 size={14} className="mr-1" />{T.share}
                  </Button>
                </div>
                {data.referralCode && (
                  <p className="text-xs text-slate-400">{T.myCode}：<span className="font-mono font-semibold text-slate-600 tracking-widest">{data.referralCode}</span></p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{T.loginFirst}</p>
            )}
          </CardContent>
        </Card>

        {/* 统计 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <TrendingUp size={18} className="text-blue-500" />, label: T.clicks,   value: data?.clickCount ?? 0 },
            { icon: <Users size={18} className="text-purple-500" />,    label: T.invited,  value: data?.invitedCount ?? 0 },
            { icon: <Gift size={18} className="text-emerald-500" />,    label: T.activated, value: data?.activatedCount ?? 0 },
          ].map(s => (
            <Card key={s.label} className="bg-white/80 backdrop-blur border-white/60">
              <CardContent className="pt-4 pb-3 text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-slate-800">{loading ? "-" : s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 折扣券 */}
        <Card className="bg-white/80 backdrop-blur border-white/60">
          <CardContent className="pt-5 space-y-3">
            <div>
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Gift size={16} className="text-emerald-500" />{T.myCoupons}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{T.couponSub}</p>
            </div>

            {loading ? (
              <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ) : !data?.discountCodes?.length ? (
              <div className="text-center py-8 text-sm text-muted-foreground">{T.noCoupons}</div>
            ) : (
              data.discountCodes.map((dc: any) => {
                const isExpired = dc.expires_at && new Date(dc.expires_at) < new Date()
                const isUsedUp = dc.used_count >= dc.max_uses
                const inactive = isExpired || isUsedUp
                const discountPct = Math.round((1 - dc.discount) * 100)
                return (
                  <div key={dc.code} className={`rounded-xl border p-4 transition-all ${inactive ? "opacity-50 bg-slate-50" : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* 折扣标签 */}
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${inactive ? "bg-slate-200" : "bg-emerald-500"}`}>
                          <span className="text-white font-bold text-lg leading-none">{discountPct}%</span>
                          <span className="text-white/80 text-[10px]">{T.discount}</span>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-base text-slate-800 tracking-widest">{dc.code}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {dc.max_uses - dc.used_count} {T.uses}
                            {dc.expires_at && <span className="ml-2">· {T.expires} {new Date(dc.expires_at).toLocaleDateString()}</span>}
                          </div>
                          {inactive && <div className="text-xs text-red-400 mt-0.5">{isExpired ? T.expired : T.usedUp}</div>}
                        </div>
                      </div>
                      {!inactive && (
                        <button onClick={() => handleCopyCode(dc.code)}
                          className="text-xs text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-100 transition-colors shrink-0">
                          {codeCopied === dc.code ? <><Check size={12} className="inline mr-1" />{T.copied}</> : <><Copy size={12} className="inline mr-1" />{T.copy}</>}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* 规则 */}
        <Card className="bg-white/80 backdrop-blur border-white/60">
          <CardContent className="pt-5 space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm">{T.rules}</h3>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {[T.rule1, T.rule2, T.rule3, T.rule4, T.rule5].map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
