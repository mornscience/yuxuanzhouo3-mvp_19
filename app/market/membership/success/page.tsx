"use client"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Zap, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { t } from "@/lib/market/i18n"

function MembershipSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const membershipId = searchParams.get("membership_id")
  const [done, setDone] = useState(false)
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    // 主动触发会员状态同步（防止webhook未触发）
    const syncMembership = async () => {
      if (sessionId) {
        try {
          await fetch("/api/market/membership/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          })
        } catch (error) {
          console.error("Failed to sync membership:", error)
        }
      }
      
      const timer = setTimeout(() => {
        setProcessing(false)
        setDone(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
    
    syncMembership()
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 max-w-md w-full text-center space-y-5">
        {!done ? (
          <Loader2 size={40} className="animate-spin text-blue-500 mx-auto" />
        ) : (
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-slate-800">{t("purchase_success")}</h1>
        <p className="text-slate-500 text-sm">{t("quota_added")}</p>
        <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-center gap-2 text-blue-700 text-sm">
          <Zap size={16} className="text-blue-500" />
          Credits have been added to your account
        </div>
        <Button onClick={() => router.push("/market/ai-search")} className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl">
          {t("start_ai_search")} <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  )
}

export default function MembershipSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Skeleton className="h-80 w-96 rounded-3xl" /></div>}>
      <MembershipSuccessContent />
    </Suspense>
  )
}
