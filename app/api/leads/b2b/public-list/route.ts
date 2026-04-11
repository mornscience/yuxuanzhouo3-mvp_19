import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError } from "@/lib/api-utils"
import { loadPublicB2BLeads } from "@/lib/market/acquisition"

export async function GET(request: NextRequest) {
  try {
    // Verify login (all logged-in users can view public leads)
    requireAuth(request)

    // Get query parameters
    const url = new URL(request.url)
    const region = url.searchParams.get("region") || undefined
    const status = url.searchParams.get("status") || undefined
    const sortBy = (url.searchParams.get("sortBy") as "newest" | "highestValue") || "newest"

    // Load public leads with filters
    const leads = await loadPublicB2BLeads({
      region,
      status,
      sortBy,
    })

    return successResponse("获取公共线索池成功", {
      data: leads,
      total: leads.length,
    })

  } catch (error) {
    return handleApiError(error)
  }
}
