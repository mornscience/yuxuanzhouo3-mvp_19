import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AcquisitionClient } from "./acquisition-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function MarketAcquisitionPage() {
  // 简化认证：实际项目中应检查用户权限
  // await requireMarketAdminSession()

  return (
    <>
      {/* Full viewport background wrapper */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, #e6f3ff 0%, #f0f0ff 50%, #e8f4f8 100%)'
        }}
      />
      
      {/* Decorative background elements - full viewport */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="min-h-screen px-4 py-4 md:px-8 md:py-6">
        <div className="mx-auto max-w-[1400px] space-y-4">
          <div className="flex items-center">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="bg-white/50 backdrop-blur-sm hover:bg-white/80 border border-slate-200/50"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回系统首页
              </Link>
            </Button>
          </div>

          <Suspense fallback={<div className="p-8 text-center text-slate-500">加载中...</div>}>
            <AcquisitionClient />
          </Suspense>
        </div>
      </div>
    </>
  )
}
