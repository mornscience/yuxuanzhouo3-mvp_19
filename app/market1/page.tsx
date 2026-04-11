import Link from "next/link"
import { ArrowRight, BellRing, Megaphone, UserPlus2, UsersRound } from "lucide-react"
import { requireSession } from "./require-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SUBSYSTEMS = [
  {
    id: "1",
    title: "用户分析系统",
    description: "留存、活跃率、用户习惯与首次使用行为分析",
    href: "/market1/analytics",
    status: "已完成",
    icon: UsersRound,
  },
  {
    id: "2",
    title: "产品获客系统",
    description: "AI 搜索博主/企业/VC，自动提取邮箱并发送合作邀约",
    href: "/market1/acquisition",
    status: "已完成",
    icon: Megaphone,
  },
  {
    id: "3",
    title: "产品通知系统",
    description: "冷召回与惊奇文章推送策略中心",
    href: "/market1/notifications",
    status: "规划中",
    icon: BellRing,
  },
  {
    id: "4",
    title: "营销中台",
    description: "统一钱包、裂变拉新、提现审核与资产管理",
    href: "/market1/fission",
    status: "已完成",
    icon: UserPlus2,
  },
] as const

export default async function Market1Page() {
  await requireSession()

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white px-6 py-7 md:px-8 md:py-10 shadow-sm">
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">选择要进入的子系统</h1>
          <p className="mt-2 text-sm text-gray-500 md:text-base">
            当前已开放四个子系统入口，你可以按业务目标自由进入对应系统。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {SUBSYSTEMS.map((system) => (
            <div key={system.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                    <system.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${system.status === "已完成" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {system.status}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{system.id}. {system.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{system.description}</p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <Link href={system.href}
                  className="flex items-center justify-between w-full h-10 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                  进入系统
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
