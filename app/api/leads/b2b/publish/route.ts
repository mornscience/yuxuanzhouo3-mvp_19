import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError, validateRequiredFields } from "@/lib/api-utils"
import { publishB2BLead } from "@/lib/market/acquisition"

export async function POST(request: NextRequest) {
  try {
    // Verify login
    const userId = requireAuth(request)

    // Parse request body
    const body = await request.json()

    // Validate required fields
    const validationError = validateRequiredFields(body, ["leadId", "isPublic"])
    if (validationError) {
      throw new Error(validationError)
    }

    const { leadId, isPublic } = body

    // Publish or unpublish the lead
    const result = await publishB2BLead(userId, leadId, isPublic)

    if (!result) {
      throw new Error("线索不存在、无权操作或该线索类型不支持发布")
    }

    // Check if type is publish
    if (result.type !== "publish") {
      throw new Error("只有发布型线索才能上架到线索池")
    }

    const message = isPublic 
      ? "需求已上架到线索池" 
      : "需求已下架，仅自己可见"

    return successResponse(message, result)

  } catch (error) {
    return handleApiError(error)
  }
}
