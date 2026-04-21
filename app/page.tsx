"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Globe,
  Moon,
  Sun,
  ArrowRight,
  Users,
  TrendingUp,
  DollarSign,
  Network,
  Sparkles,
  Building2,
  Target,
  Zap,
  User,
  LogOut,
  Play,
  Settings,
} from "lucide-react"

export default function HomePage() {
  const [isDark, setIsDark] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const regionMode = (process.env.NEXT_PUBLIC_SITE_REGION ?? "auto").toLowerCase()
  const [lang, setLang] = useState<"en" | "zh">(() =>
    regionMode === "cn" ? "zh" : "en",
  )
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [aiQuota, setAiQuota] = useState<{ remainingCalls: number; balance: number } | null>(null)

  // 检查用户登录状态
  const checkUserLogin = async () => {
    try {
      // 从localStorage中获取用户信息
      const localStorageValue = localStorage.getItem('market_user')
      let userId = null
      
      if (localStorageValue) {
        try {
          const userData = JSON.parse(localStorageValue)
          userId = userData.userId
        } catch (e) {
          // 解析失败，清除localStorage
          localStorage.removeItem('market_user')
        }
      }
      
      // 如果localStorage中没有，再从cookie中获取
      if (!userId) {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith('market_user_id='))
          ?.split('=')[1]
        
        userId = cookieValue ? decodeURIComponent(cookieValue) : null
      }
      
      if (userId) {
        setLoading(true)
        // 获取用户信息
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        
        if (data.ok && data.data) {
          setUser(data.data)
          // 拉取 AI 搜索剩余次数
          fetch('/api/market/ai-search', { credentials: 'include' })
            .then(r => r.json())
            .then(q => { if (q.ok && q.quota) setAiQuota(q.quota) })
            .catch(() => {})
        } else {
          setUser(null)
          setAiQuota(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking user login:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // 获取激活的视频
  const getActiveVideo = async () => {
    try {
      const response = await fetch('/api/admin/video-deduction/active')
      const data = await response.json()
      
      if (data.success && data.data) {
        setActiveVideo(data.data.video_url)
      }
    } catch (error) {
      console.error('Error getting active video:', error)
    }
  }

  // 初始检查
  useEffect(() => {
    // 处理 Google 登录回调参数
    const params = new URLSearchParams(window.location.search)
    if (params.get('google_login') === 'success') {
      const userId = params.get('userId')
      const email = params.get('email')
      const nickname = params.get('nickname')
      const avatar = params.get('avatar')
      if (userId) {
        localStorage.setItem('market_user', JSON.stringify({ userId, email, nickname, avatar }))
        // 清除 URL 参数
        window.history.replaceState({}, '', '/')
      }
    }
    checkUserLogin()
    getActiveVideo()
  }, [])

  // 监听 storage 变化，处理登录/登出事件
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'market_user') {
        checkUserLogin()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  const content = {
    en: {
      nav: {
        blogger: "Blogger Connector",
        ceo: "B2B Demand Finance/CEO Connector",
        investor: "Investor Connector",
      },
      hero: {
        title: "Build, Scale, Fund",
        subtitle: "All in One AI Business OS",
        description:
          "mornbusiness is the AI operating system for founders, CEOs, and investors. From idea to unicorn — powered by artificial intelligence.",
        cta1: "Start Building",
        cta2: "View Demo",
      },
      systems: {
        title: "Core Business Infrastructure",
        subtitle: "Three mandatory systems powering your growth",
        blogger: {
          title: "10M+ Blogger Growth Engine (Influencer Mode)",
          subtitle: "Global Creator Network",
          description:
            "Connect with 10M+ bloggers, influencers and media channels. Build your content matrix, traffic system and brand army.",
          features: ["Content Matrix System", "Viral Topic Generator", "Influencer CRM", "SEO Distribution System"],
        },
        ceo: {
          title: "Ad-to-Earn Advertising Tasks (Task Mode)",
          subtitle: "Global User Ad Interaction & Earning Platform",
          description:
            "Participate in ad viewing and interaction, complete simple tasks to earn cash rewards, real-time crediting, flexible withdrawals.",
          features: ["Ad Task Plaza", "Real-time Reward Settlement", "Flexible Withdrawal Channels", "Anti-fraud Risk Control System"],
        },
        investor: {
          title: "Business & Capital Connector (Merchant & Funding Mode)",
          subtitle: "Global Business Cooperation & Funding Service Hub",
          description: "Connect with enterprise CEOs, institutions and VCs, one-stop implementation of business cooperation, customer acquisition and project financing.",
          features: ["CEO Intelligent Matching", "Financial Modeling System", "Business Strategy AI", "Deal Room", "Investor Matching", "Policy Subsidy Database", "BP Generation AI", "Roadshow Assistant"],
        },
      },
      optional: {
        title: "Optional Expansion Modules",
        subtitle: "Extend your business OS capabilities",
      },
      cta: {
        title: "Start Your AI Business Empire Today",
        button: "Launch Project",
      },
      footer: {
        tagline: "AI Business Operating System",
        subtitle: "From startup to unicorn.",
      },
    },
    zh: {
      nav: {
        blogger: "博主连接器",
        ceo: "任务连接器",
        investor: "商业资本连接器",
      },
      hero: {
        title: "用 AI 搭建、增长、融资",
        subtitle: "你的商业帝国",
        description: "mornbusiness 是全球创业者、CEO 与投资人的 AI 商业操作系统。从创意到独角兽，一站式智能中枢。",
        cta1: "立即开始",
        cta2: "查看演示",
      },
      systems: {
        title: "核心商业基础设施",
        subtitle: "三大核心系统驱动你的增长",
        blogger: {
            title: "1000万博主增长引擎（达人模式）",
          subtitle: "全球内容创作者网络",
          description: "连接全球博主、媒体与内容创作者。构建你的内容矩阵与流量帝国。",
          features: ["内容矩阵系统", "爆款选题引擎", "博主CRM", "SEO分发系统"],
        },
        ceo: {
          title: "广告任务赚收益（任务模式）",
          subtitle: "全球用户广告互动与收益平台",
          description: "参与广告观看与互动，完成简单任务即可获得现金奖励，实时到账，灵活提现。",
          features: ["广告任务广场", "实时奖励结算", "灵活提现通道", "防刷风控系统"],
        },
        investor: {
          title: "商业与资本连接器（商家和融资模式）",
          subtitle: "全球商业合作与融资服务中枢",
          description: "对接企业 CEO、机构与 VC，一站式实现商业合作、获客引流与项目融资。",
          features: [
            "CEO智能匹配",
            "财务建模系统",
            "商业战略AI",
            "交易室",
            "投资人匹配",
            "政策与补贴数据库",
            "BP生成AI",
            "路演助手",
          ],
        },
      },
      optional: {
        title: "可选扩展模块",
        subtitle: "扩展你的商业操作系统能力",
      },
      cta: {
        title: "今天就启动你的 AI 商业帝国",
        button: "启动项目",
      },
      footer: {
        tagline: "AI 商业操作系统",
        subtitle: "从创业到独角兽",
      },
    },
  }

  const t = content[lang]

  const productLinks = [
    { icon: Zap, name: lang === "en" ? "AI Coder" : "AI 程序员", cn: "/ai-coder", intl: "/ai-coder" },
    { icon: Zap, name: "sitehub", cn: "https://site.mornscience.top/", intl: "https://www.mornhub.help/" },
    { icon: Users, name: "personalink", cn: "https://personalink.mornscience.top", intl: "https://www.mornhub.lat" },
    { icon: Building2, name: "mornspeaker", cn: "https://mornspeaker.mornscience.top/", intl: "https://www.mornscience.onl/" },
    { icon: Target, name: "mornclient", cn: "https://mornclient.mornscience.top/", intl: "https://www.mornscience.biz" },
    { icon: TrendingUp, name: "morncoach", cn: "http://morncoach.mornscience.top", intl: "https://mornhub.biz" },
    { icon: Globe, name: "morntool", cn: "http://morntool.mornscience.top", intl: "https://www.mornhub.lol/" },
    { icon: Network, name: "mornfront", cn: "https://mornfront.mornscience.top/", intl: "https://www.mornscience.dev/" },
    { icon: Sparkles, name: "multigpt", cn: "https://multigpt.mornscience.top/", intl: "https://morn.work/" },
    { icon: DollarSign, name: "OrbitChat", cn: "https://orbital.mornscience.top/", intl: "http://mornscience.work/" },
    { icon: Moon, name: "mornxyz", cn: "https://mornxyz.mornscience.top/", intl: "https://www.mornhub.xyz/" },
    { icon: Sun, name: "morngpt", cn: "https://morngpt.mornscience.top/", intl: "https://www.morn.work/" },
    { icon: ArrowRight, name: "mornfake", cn: "https://mornfake.mornscience.top", intl: "https://www.mornhub.pics" },
    { icon: Users, name: "mornhome", cn: "https://mornhome.mornscience.top", intl: "https://mornhub.homes/" },
  ]
  const isCnRegion = regionMode === "cn" ? true : regionMode === "intl" ? false : lang === "zh"
  const regionLabel =
    regionMode === "cn" ? "CN" : regionMode === "intl" ? "INTL" : lang === "zh" ? "CN (AUTO)" : "INTL (AUTO)"

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground transition-colors">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo - leftmost */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">mornbusiness</span>
            </div>

            {/* Navigation - center */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/market/acquisition?mode=influencer" className="text-sm font-medium hover:text-blue-600 transition-colors">
                {t.nav.blogger}
              </Link>
              <Link href="/market/acquisition?mode=task" className="text-sm font-medium hover:text-purple-600 transition-colors">
                {t.nav.ceo}
              </Link>
              <Link href="/market/acquisition?mode=merchant" className="text-sm font-medium hover:text-green-600 transition-colors">
                {t.nav.investor}
              </Link>
            </nav>

            {/* Controls - rightmost */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setLang(lang === "en" ? "zh" : "en")}>
                <Globe className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowVideo(true)} title="播放视频">
                <Play className="w-5 h-5" />
              </Button>
              <span className="hidden sm:inline-flex items-center rounded-md border border-border/40 px-2 py-1 text-[11px] text-muted-foreground">
                {regionLabel}
              </span>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        {user.profile?.avatar ? (
                          <img src={user.profile.avatar} alt={user.profile?.nickname || user.user?.email} />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-primary text-primary-foreground">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background border border-border rounded-md shadow-lg">
                    <div className="flex items-center justify-start p-2">
                      <Avatar className="h-10 w-10 mr-2">
                        {user.profile?.avatar ? (
                          <img src={user.profile.avatar} alt={user.profile?.nickname || user.user?.email} />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-primary text-primary-foreground">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.profile?.nickname || user.user?.email}</p>
                        <p className="text-sm text-muted-foreground">{user.user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/market/profile">{lang === "en" ? "Profile" : "个人资料"}</Link>
                    </DropdownMenuItem>
                    {aiQuota !== null && (
                      <div className="px-2 py-1.5 mx-1 my-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">AI 搜索剩余</span>
                          <span className={`font-semibold ${aiQuota.remainingCalls <= 20 ? "text-red-500" : aiQuota.remainingCalls <= 50 ? "text-orange-500" : "text-blue-600 dark:text-blue-400"}`}>
                            约 {aiQuota.remainingCalls} 次
                          </span>
                        </div>
                        <div className="mt-1 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${aiQuota.remainingCalls <= 20 ? "bg-red-500" : aiQuota.remainingCalls <= 50 ? "bg-orange-400" : "bg-blue-500"}`}
                            style={{ width: `${Math.min((aiQuota.balance / 0.1) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}                    <DropdownMenuItem asChild>
                      <Link href="/market/transactions">{lang === "en" ? "Transactions" : "交易记录"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/market/my-tasks">{lang === "en" ? "My Tasks" : "我的任务"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/market/my-applications">{lang === "en" ? "My Applications" : "我的申请"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/market/invite">{lang === "en" ? "Invite Friends" : "邀请好友"}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/api/logout" onClick={(e) => {
                        e.preventDefault()
                        fetch('/api/logout', { method: 'POST' })
                          .then(() => {
                            setUser(null)
                            window.location.reload()
                          })
                      }}>
                        <LogOut className="h-4 w-4 mr-2" />
                        {lang === "en" ? "Log out" : "退出登录"}
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">{lang === "en" ? "Log in" : "登录"}</Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-6">
              <div className="inline-block px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium border border-blue-500/20">
                {lang === "en" ? "AI for Enterprise" : "企业级 AI 平台"}
              </div>

              <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-balance">
                {t.hero.title}
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  {t.hero.subtitle}
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                {t.hero.description}
              </p>

              <div className="flex items-center justify-center gap-4 pt-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/launch">
                    {t.hero.cta1}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/market/acquisition">{t.hero.cta2}</Link>
                </Button>
              </div>

              {/* Quick links to developer tools */}
              <div className="flex items-center justify-center gap-3 pt-3">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/ide">{lang === "en" ? "Online IDE" : "在线 IDE"}</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/project/studio">{lang === "en" ? "Project Studio" : "项目生成/部署"}</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/ai-coder">{lang === "en" ? "AI Coder" : "AI 程序员"}</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/scaffold">{lang === "en" ? "Scaffold UI" : "脚手架生成"}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Core Systems Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl font-bold text-balance">{t.systems.title}</h2>
              <p className="text-lg text-muted-foreground">{t.systems.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Blogger Connector */}
              <Card
                id="blogger"
                className="p-8 space-y-6 border-2 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/10 scroll-mt-20"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{t.systems.blogger.title}</h3>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t.systems.blogger.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed">{t.systems.blogger.description}</p>
                </div>
                <ul className="space-y-2">
                  {t.systems.blogger.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/market/acquisition?mode=influencer">
                    {lang === "en" ? "Explore" : "了解更多"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </Card>

              {/* CEO Connector */}
              <Card
                id="ceo"
                className="p-8 space-y-6 border-2 hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/10 scroll-mt-20"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{t.systems.ceo.title}</h3>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t.systems.ceo.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed">{t.systems.ceo.description}</p>
                </div>
                <ul className="space-y-2">
                  {t.systems.ceo.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/market/acquisition?mode=task">
                    {lang === "en" ? "Explore" : "了解更多"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </Card>

              {/* Investor Connector */}
              <Card
                id="investor"
                className="p-8 space-y-6 border-2 hover:border-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/10 scroll-mt-20"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{t.systems.investor.title}</h3>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {t.systems.investor.subtitle}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">{t.systems.investor.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-10 gap-y-2">
                  <ul className="space-y-2">
                    {t.systems.investor.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-2">
                    {t.systems.investor.features.slice(4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/market/acquisition?mode=merchant">
                    {lang === "en" ? "Explore" : "了解更多"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Optional Modules Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">{t.optional.title}</h2>
              <p className="text-muted-foreground">{t.optional.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {productLinks.slice(0, 9).map((product, i) => {
                const Icon = product.icon
                const href = isCnRegion ? product.cn : product.intl
                return (
                  <a key={i} href={href} target="_blank" rel="noreferrer" className="block">
                    <Card className="p-6 hover:border-primary transition-colors cursor-pointer h-full">
                      <div className="space-y-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{isCnRegion ? "CN" : "INTL"}</p>
                      </div>
                    </Card>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-bold">
                {lang === "en" ? "Your AI Business Infrastructure" : "你的 AI 商业基础设施"}
              </h2>
              <p className="text-xl text-muted-foreground">
                {lang === "en" ? "One OS. Infinite Possibilities." : "一个系统，无限可能"}
              </p>
            </div>

            <div className="relative">
              <div className="grid md:grid-cols-5 gap-4">
                {productLinks.slice(8).map((product, i) => {
                  const href = isCnRegion ? product.cn : product.intl
                  return (
                    <a key={i} href={href} target="_blank" rel="noreferrer" className="block">
                      <Card className="p-6 text-center space-y-3 hover:scale-105 transition-transform h-full">
                        <div className="w-full h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Network className="w-8 h-8 text-white" />
                        </div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{isCnRegion ? "CN" : "INTL"}</p>
                      </Card>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-32 px-4">
          <div className="container mx-auto max-w-4xl text-center space-y-8">
            <h2 className="text-5xl font-bold text-balance">{t.cta.title}</h2>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/launch">
                  {t.cta.button}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/connect-capital">{lang === "en" ? "Connect Capital" : "对接资本"}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12 px-4">
          <div className="container mx-auto max-w-6xl text-center space-y-2">
            <p className="text-xl font-bold">mornbusiness — {t.footer.tagline}</p>
            <p className="text-muted-foreground">{t.footer.subtitle}</p>
          </div>
        </footer>

        {/* Video Modal */}
        {showVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowVideo(false)}>
            <div className="relative w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
              <button
                className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl"
                onClick={() => setShowVideo(false)}
              >
                ✕
              </button>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video className="w-full h-full" controls autoPlay>
                  <source src={activeVideo || "/videos/6c07be436fbc5b9f38fd0c38a02e5eff_raw.mp4"} type="video/mp4" />
                  {lang === "en" ? "Your browser does not support the video tag." : "您的浏览器不支持视频播放。"}
                </video>
              </div>
              <p className="text-center text-white mt-4 text-sm">
                {lang === "en" ? "Click outside the video to close" : "点击视频外部区域关闭"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
