import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/market/db-adapter"

export async function GET(request: Request) {
  try {
    const userId = requireAuth(request)

    // 获取用户的邮件草稿
    const draftRows = await dbAdapter.loadRows("ai_customer_email_drafts", { user_id: userId })

    const drafts = draftRows
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(row => ({
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        subject: row.subject,
        body: row.body,
        status: row.status,
        aiGenerated: row.ai_generated,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))

    return NextResponse.json({
      ok: true,
      data: drafts
    })

  } catch (error: any) {
    console.error("Get drafts error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "Failed to get drafts"
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { draftId, subject, body: emailBody } = body

    await dbAdapter.updateRow("ai_customer_email_drafts", { id: draftId, user_id: userId }, {
      subject,
      body: emailBody,
      status: 'draft',
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      ok: true,
      message: "Draft updated successfully"
    })

  } catch (error: any) {
    console.error("Update draft error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "Failed to update draft"
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { draftId } = body

    await dbAdapter.deleteRow("ai_customer_email_drafts", { id: draftId, user_id: userId })

    return NextResponse.json({
      ok: true,
      message: "Draft deleted successfully"
    })

  } catch (error: any) {
    console.error("Delete draft error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "Failed to delete draft"
    }, { status: 500 })
  }
}
