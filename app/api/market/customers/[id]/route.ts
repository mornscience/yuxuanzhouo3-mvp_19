import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"
import { requireAuth } from "@/lib/api-utils"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = requireAuth(request as any)
    const { id: customerId } = await params

    if (!customerId) {
      return NextResponse.json({ ok: false, message: "缺少客户ID" }, { status: 400 })
    }

    // 删除客户记录
    const deleted = await dbAdapter.deleteRow("overseas_customers", { id: customerId })

    if (deleted) {
      console.log("[API] Customer deleted:", customerId)
      return NextResponse.json({
        ok: true,
        message: "客户已删除"
      })
    } else {
      return NextResponse.json({
        ok: false,
        message: "客户不存在"
      }, { status: 404 })
    }

  } catch (error: any) {
    console.error("[API] Failed to delete customer:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "删除客户失败"
    }, { status: 500 })
  }
}