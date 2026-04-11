import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { applyForCooperation } from "@/lib/market/acquisition"

export async function POST(request: NextRequest) {
  try {
    // Verify login
    const userId = requireAuth(request)

    // Parse request body
    const body = await request.json()

    // Validate required fields
    const validationError = validateRequiredFields(body, ["leadId", "applicantName", "applicantContact", "applicantEmail"])
    if (validationError) {
      throw new Error(validationError)
    }

    const { leadId, applicantName, applicantContact, applicantEmail, message } = body

    // Apply for cooperation
    const result = await applyForCooperation(leadId, userId, {
      applicantName,
      applicantContact,
      applicantEmail,
      message,
    })

    if (!result.success) {
      throw new Error(result.message)
    }

    return successResponse(result.message)

  } catch (error) {
    return handleApiError(error)
  }
}
