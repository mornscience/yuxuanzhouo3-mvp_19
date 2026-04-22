import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ReferralPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const trimmedCode = code?.trim()
  // 把邀请码带到注册页，注册页读取后存 localStorage
  redirect(`/register?ref=${encodeURIComponent(trimmedCode || "")}`)
}
