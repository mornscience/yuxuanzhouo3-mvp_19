import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError } from "@/lib/api-utils"
import { loadMyReceivedApplications, loadMySentApplications, updateApplicationStatus } from "@/lib/market/acquisition"

// GET: Load my received applications (as lead owner) or sent applications (as applicant)
export async function GET(request: NextRequest) {
  try {
    // Verify login
    const userId = requireAuth(request)

    // Get query parameters
    const url = new URL(request.url)
    const type = url.searchParams.get("type") || "received" // "received" or "sent"

    let applications
    if (type === "received") {
      // Load applications received for my leads
      applications = await loadMyReceivedApplications(userId)
    } else {
      // Load applications I sent to others
      applications = await loadMySentApplications(userId)
    }

    return successResponse("获取合作申请成功", {
      data: applications,
      total: applications.length,
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// POST: Update application status (approve/reject)
export async function POST(request: NextRequest) {
  try {
    // Verify login
    const userId = requireAuth(request)

    // Parse request body
    const body = await request.json()
    const { applicationId, status } = body

    if (!applicationId || !status || !["approved", "rejected"].includes(status)) {
      throw new Error("参数错误：需要 applicationId 和 status (approved/rejected)")
    }

    // Update application status
    const result = await updateApplicationStatus(userId, applicationId, status)

    if (!result.success) {
      throw new Error(result.message)
    }

    return successResponse(result.message)

  } catch (error) {
    return handleApiError(error)
  }
}
