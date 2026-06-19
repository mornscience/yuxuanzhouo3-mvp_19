import { NextRequest } from "next/server"
import { successResponse, handleApiError } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"
import { requireAdminSession } from "@/lib/admin/session"
import { createNotification } from "@/lib/market/notification-service"

const USER_MARKET_PROFILES_TABLE = "user_market_profiles"

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession()

    const { createClient } = await import("@supabase/supabase-js")
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profiles } = await sb
      .from("user_market_profiles")
      .select("*")

    const filteredProfiles = profiles?.filter((p: any) => {
      return p.company_name && p.company_name !== "EMPTY" && p.company_name !== "NULL" && p.company_name !== null
    }) || []

    filteredProfiles.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    return successResponse("获取商家认证列表成功", filteredProfiles)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdminSession()

    const body = await request.json()
    const { userId, status, rejectReason, action } = body

    let updateData: Record<string, any>

    if (action === "delete") {
      await dbAdapter.deleteRow(USER_MARKET_PROFILES_TABLE, { user_id: userId })
      return successResponse("申请已删除")
    } else {
      updateData = {
        merchant_verify_status: status,
        is_merchant_verified: status === "approved",
        merchant_reject_reason: rejectReason || null,
        updated_at: new Date().toISOString()
      }
    }

    await dbAdapter.updateRow(USER_MARKET_PROFILES_TABLE, { user_id: userId }, updateData)

    // 发送通知给用户
    if (action !== "delete") {
      if (status === "approved") {
        await createNotification({
          userId,
          type: "merchant_approved",
          title: "Merchant Verification Approved",
          message: "Congratulations! Your merchant verification application has been approved. You can now post ads, manage leads, and more."
        })
      } else if (status === "rejected") {
        await createNotification({
          userId,
          type: "merchant_rejected",
          title: "Merchant Verification Rejected",
          message: rejectReason
            ? `Your merchant verification application was not approved. Reason: ${rejectReason}`
            : "Your merchant verification application was not approved. Please check and resubmit."
        })
      }
    }

    if (action === "delete") {
      return successResponse("Application deleted")
    }
    return successResponse(status === "approved" ? "Verification approved" : "Verification rejected")

  } catch (error) {
    return handleApiError(error)
  }
}