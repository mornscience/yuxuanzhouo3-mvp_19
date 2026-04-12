"use client"
import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Loader2, Zap, ArrowLeft, Star, Shield, CreditCard } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { t } from "@/lib/market/i18n"

interface Plan {
  id: string
  name: string
  months: number
  original_price: string
  final_price: string
  ai_quota: number
  description: string
  region: string
}

const glassCard = {
  background: "linear-gradient(135deg,rgba(255,255,255,0.88) 0%,rgba(239,246,255,0.82) 60%,rgba(243,232,255,0.88) 100%)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 4px 24px rgba(59,130,246,0.08),inset 0 1px 0 rgba(255,255,255,0.8)",
}

function MembershipContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from")

  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [discountCode, setDiscountCode] = useState("")
  const [discountInfo, setDiscountInfo] = useState<{ discount: number; finalPrice: number } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/market/membership/plans?region=intl", { credentials: "include" })
      .then(r => r.json())
      .then(json => {
        if (json.ok && json.data?.length) {
          setPlans(json.data)
          setSelectedPlan(json.data[0])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleVerifyCode = async () => {
    if (!discountCode.trim()) return
    setVerifying(true)
    setError("")
    try {
      const res = await fetch("/api/market/membership/discount", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.trim() })
      })
      let json: any = {}
      try { json = await res.json() } catch { json = { ok: false, message: "Server error" } }
      if (json.ok) {
        const base = parseFloat(selectedPlan?.final_price || "0")
        // discount is a multiplier (e.g. 0.9 = 10% off)
        const discountMultiplier = json.discount
        const discountPercent = Math.round((1 - discountMultiplier) * 100)
        setDiscountInfo({ discount: discountPercent, finalPrice: base * discountMultiplier })
      } else {
        setError(json.message || "Invalid discount code")
      }
    } catch { setError("Network error, please try again") }
    finally { setVerifying(false) }
  }

  const handlePurchase = async () => {
    if (!selectedPlan) return
    setPurchasing(true)
    setError("")
    try {
      const res = await fetch("/api/market/membership/purchase", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          discountCode: discountCode.trim() || undefined,
          paymentMethod: "stripe",
        })
      })
      const json = await res.json()
      if (json.ok) {
        // Stripe returns { url }, PayPal returns { orderId }, WeChat returns { codeUrl }
        if (json.url) window.location.href = json.url
        else if (json.data?.checkoutUrl) window.location.href = json.data.checkoutUrl
        else router.push("/market/membership/success")
      } else {
        setError(json.message || "Purchase failed")
      }
    } catch { setError("Purchase failed, please try again") }
    finally { setPurchasing(false) }
  }

  const currency = "$"
  const finalPrice = discountInfo
    ? discountInfo.finalPrice.toFixed(2)
    : parseFloat(selectedPlan?.final_price || "0").toFixed(2)

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
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            {t("back")}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Star size={12} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">{t("upgrade_membership")}</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Hero */}
        <div className="text-center space-y-2 pb-2">
          <h1 className="text-2xl font-bold text-slate-900">{t("upgrade_membership")}</h1>
          <p className="text-slate-500 text-sm">{t("select_plan")}</p>
          {from === "quota" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-sm mt-2">
              <Zap size={14} /> Insufficient AI search balance — top up to continue
            </div>
          )}
        </div>

        {/* Plans */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan, idx) => {
              const isSelected = selectedPlan?.id === plan.id
              const isPopular = idx === 1
              return (
                <div
                  key={plan.id}
                  onClick={() => { setSelectedPlan(plan); setDiscountInfo(null) }}
                  className="relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                  style={isSelected ? {
                    background: "linear-gradient(135deg,rgba(239,246,255,0.95) 0%,rgba(219,234,254,0.9) 100%)",
                    backdropFilter: "blur(20px)",
                    border: "2px solid rgba(59,130,246,0.5)",
                    boxShadow: "0 8px 32px rgba(59,130,246,0.15)",
                  } : {
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(203,213,225,0.5)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {isPopular && (
                    <span className="absolute -top-2.5 left-5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                        {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{plan.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Zap size={11} className="text-blue-500" />
                          <span className="text-xs text-blue-600 font-medium">+{currency}{plan.ai_quota} AI credits</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {plan.original_price !== plan.final_price && (
                        <p className="text-xs text-slate-400 line-through">{currency}{plan.original_price}</p>
                      )}
                      <p className={`text-xl font-bold ${isSelected ? "text-blue-600" : "text-slate-800"}`}>
                        {currency}{plan.final_price}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Order Summary */}
        <div className="rounded-3xl p-6 space-y-4" style={glassCard}>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield size={16} className="text-blue-500" />
            {t("order_confirm")}
          </h3>

          {/* Discount code */}
          <div className="flex gap-2">
            <input
              value={discountCode}
              onChange={e => { setDiscountCode(e.target.value); setDiscountInfo(null) }}
              placeholder={t("discount_code")}
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-white/60 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
            <button
              onClick={handleVerifyCode}
              disabled={verifying || !discountCode.trim()}
              className="h-11 px-5 rounded-xl border border-slate-200 bg-white/70 text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50"
            >
              {verifying ? <Loader2 size={14} className="animate-spin" /> : t("verify")}
            </button>
          </div>

          {discountInfo && (
            <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
              <Check size={14} /> {discountInfo.discount}% discount applied
            </p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CreditCard size={14} className="text-slate-400" />
                {t("payment_method")}
              </span>
              <span className="font-medium text-slate-700">Stripe</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/60">
              <span className="font-bold text-slate-800">Total</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {currency}{finalPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t("membership_benefits")}</p>
          <div className="grid grid-cols-2 gap-2">
            {["AI Smart Search credits", "Blogger pool access", "Enterprise leads", "VC connection pool"].map(b => (
              <div key={b} className="flex items-center gap-1.5 text-xs text-slate-600">
                <Check size={12} className="text-emerald-500 flex-shrink-0" /> {b}
              </div>
            ))}
          </div>
        </div>

        {/* Buy button */}
        <button
          onClick={handlePurchase}
          disabled={purchasing || !selectedPlan || loading}
          className="w-full h-13 py-3.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white font-semibold text-base shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          {purchasing
            ? <><Loader2 size={18} className="animate-spin" /> {t("processing")}</>
            : <><Star size={16} /> {t("pay_now")}</>
          }
        </button>

        <p className="text-center text-xs text-slate-400">
          Secure payment powered by Stripe · Cancel anytime
        </p>
      </main>
    </div>
  )
}

export default function MembershipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-4">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    }>
      <MembershipContent />
    </Suspense>
  )
}
