import { Suspense } from "react"
import { ProfileClient } from "./profile-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-500 animate-pulse">Loading profile...</p>
          </div>
        </div>
      }>
        <ProfileClient />
      </Suspense>
    </div>
  )
}
