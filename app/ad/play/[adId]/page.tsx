import { Suspense } from "react"
import { AdPlayClient } from "./ad-play-client"

export const dynamic = "force-dynamic"

export default function AdPlayPage({ params }: { params: { adId: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    }>
      <AdPlayClient adId={params.adId} />
    </Suspense>
  )
}
