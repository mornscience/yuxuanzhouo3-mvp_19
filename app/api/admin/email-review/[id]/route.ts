import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"
import { requireAdminSession } from "@/lib/admin/session"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    
    const { id: draftId } = await params
    
    if (!draftId) {
      return NextResponse.json({ ok: false, message: "缺少草稿ID" }, { status: 400 })
    }

    const draftRows = await dbAdapter.loadRows("ai_customer_email_drafts", { id: draftId })
    if (draftRows.length === 0) {
      return NextResponse.json({ ok: false, message: "草稿不存在" }, { status: 404 })
    }

    await dbAdapter.deleteRow("ai_customer_email_drafts", { id: draftId })

    return NextResponse.json({
      ok: true,
      message: "邮件记录已删除"
    })

  } catch (error: any) {
    console.error("[Admin API] Email review delete error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "删除失败"
    }, { status: 500 })
  }
}