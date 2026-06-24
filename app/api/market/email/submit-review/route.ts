import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/market/db-adapter"

export async function POST(request: Request) {
  try {
    const userId = requireAuth(request as any)
    const body = await request.json()

    const { draftId, subject, body: emailBody } = body

    if (!draftId) {
      return NextResponse.json({ ok: false, message: "缺少草稿ID" }, { status: 400 })
    }

    // 获取草稿
    const draftRows = await dbAdapter.loadRows("ai_customer_email_drafts", { id: draftId })
    if (draftRows.length === 0) {
      return NextResponse.json({ ok: false, message: "草稿不存在" }, { status: 404 })
    }

    const draft = draftRows[0]

    // 检查草稿归属
    if (draft.user_id !== userId) {
      return NextResponse.json({ ok: false, message: "无权操作此草稿" }, { status: 403 })
    }

    // 更新草稿内容和状态为待审核
    await dbAdapter.updateRow("ai_customer_email_drafts", { id: draftId }, {
      subject: subject || draft.subject,
      body: emailBody || draft.body,
      status: "pending",
      updated_at: new Date().toISOString()
    })

    console.log("[API] Email draft submitted for review:", draftId)

    return NextResponse.json({
      ok: true,
      message: "邮件已提交审核"
    })

  } catch (error: any) {
    console.error("[API] Submit review error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "提交审核失败"
    }, { status: 500 })
  }
}