import { NextRequest, NextResponse } from "next/server"
import { applyMerchantVerification } from "@/lib/auth/service"

export async function POST(request: NextRequest) {
  try {
    // 从 cookie 中获取用户 ID
    const cookieHeader = request.headers.get("cookie") || ""
    const match = cookieHeader.match(/(?:^|;\s*)market_user_id=([^;]+)/)
    const userId = match ? decodeURIComponent(match[1]) : ""

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "用户未登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      companyName,
      creditCode,
      businessLicenseUrl,
      brandName,
      contactPerson,
      contactPhone,
      industry
    } = body

    // 验证必填字段
    if (!companyName || !creditCode || !contactPerson || !contactPhone) {
      return NextResponse.json(
        { ok: false, message: "公司名称、信用代码、联系人和联系电话为必填项" },
        { status: 400 }
      )
    }

    const result = await applyMerchantVerification(userId, {
      companyName,
      creditCode,
      businessLicenseUrl: businessLicenseUrl || "",
      brandName: brandName || "",
      contactPerson,
      contactPhone,
      industry: industry || ""
    })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: 400 }
      )
    }

    // 同步写入 market1_verify_requests，供管理后台查看
    try {
      const { createClient } = await import("@supabase/supabase-js")
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { randomUUID } = await import("crypto")
      await sb.from("market1_verify_requests").insert({
        id: `vr-${randomUUID().slice(0, 8)}`,
        user_id: userId,
        verify_type: "merchant",
        company_name: companyName,
        credit_code: creditCode,
        industry: industry || "",
        status: "approved",
        reviewed_by: "auto",
        reviewed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch (e) {
      console.warn("[merchant-apply] 写入 market1_verify_requests 失败（非致命）:", e)
    }

    return NextResponse.json({
      ok: true,
      message: result.message
    })

  } catch (error: any) {
    console.error("[API /api/profile/merchant-apply] 错误:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "商家认证失败" },
      { status: 500 }
    )
  }
}