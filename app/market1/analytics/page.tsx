import { AnalyticsDashboardClient } from "./analytics-client"
import { requireSession } from "../require-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  await requireSession()
  return <AnalyticsDashboardClient />
}
