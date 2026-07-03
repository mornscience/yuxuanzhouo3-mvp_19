import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"
import { requireAdminSession } from "@/lib/admin/session"

export async function GET(request: Request) {
  try {
    await requireAdminSession()
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const pageSize = 10
    const status = url.searchParams.get("status") || "all"
    const keyword = url.searchParams.get("keyword") || ""

    let allDrafts = await dbAdapter.loadRows("ai_customer_email_drafts")

    if (status !== "all") {
      allDrafts = allDrafts.filter(draft => draft.status === status)
    }

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      allDrafts = allDrafts.filter(draft => 
        (draft.customer_name?.toLowerCase().includes(lowerKeyword) || 
         draft.customer_email?.toLowerCase().includes(lowerKeyword))
      )
    }

    allDrafts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const totalCount = allDrafts.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const startIndex = (page - 1) * pageSize
    const drafts = allDrafts.slice(startIndex, startIndex + pageSize)

    const stats = {
      pending: allDrafts.filter(d => d.status === "pending").length,
      approved: allDrafts.filter(d => d.status === "approved").length + allDrafts.filter(d => d.status === "sent").length,
      rejected: allDrafts.filter(d => d.status === "rejected").length
    }

    return NextResponse.json({
      ok: true,
      data: drafts,
      stats,
      totalPages,
      currentPage: page
    })

  } catch (error: any) {
    console.error("[Admin API] Email review error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "获取邮件列表失败"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession()
    
    const body = await request.json()
    const { draftId, action, note } = body

    if (!draftId || !action) {
      return NextResponse.json({ ok: false, message: "缺少必要参数" }, { status: 400 })
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ ok: false, message: "无效的操作类型" }, { status: 400 })
    }

    const draftRows = await dbAdapter.loadRows("ai_customer_email_drafts", { id: draftId })
    if (draftRows.length === 0) {
      return NextResponse.json({ ok: false, message: "草稿不存在" }, { status: 404 })
    }

    const draft = draftRows[0]
    if (draft.status !== "pending") {
      return NextResponse.json({ ok: false, message: "草稿状态不允许此操作" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    await dbAdapter.updateRow("ai_customer_email_drafts", { id: draftId }, {
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
      updated_at: new Date().toISOString()
    })

    if (action === "approve") {
      console.log(`[Admin API] About to call sendEmail for draft: ${draftId}`)
      try {
        await sendEmail(draft)
        console.log(`[Admin API] sendEmail completed successfully for draft: ${draftId}`)
      } catch (emailError: any) {
        console.error(`[Admin API] sendEmail failed for draft: ${draftId}`)
        console.error(`[Admin API] Error message: ${emailError.message}`)
        console.error(`[Admin API] Error stack:`, emailError.stack)
        throw emailError
      }
      
      await dbAdapter.updateRow("ai_customer_email_drafts", { id: draftId }, {
        status: "sent",
        updated_at: new Date().toISOString()
      })
    }

    return NextResponse.json({
      ok: true,
      message: action === "approve" ? "审核通过并发送邮件" : "审核已拒绝"
    })

  } catch (error: any) {
    console.error("[Admin API] Email review action error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "审核操作失败"
    }, { status: 500 })
  }
}

async function sendEmail(draft: any) {
  console.log("[Email] ========== sendEmail function started ==========")
  console.log("[Email] Draft data:", JSON.stringify(draft, null, 2))
  
  const nodemailer = require("nodemailer")

  const userId = draft.user_id || "unknown"
  const sendId = `send_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`[Email] Generating sendId with userId: ${sendId}`)

  // 根据环境选择正确的追踪URL
  const appUrl = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL 
    : 'http://localhost:3000'
  const trackingPixelUrl = `${appUrl}/api/market/email/track/open?sendId=${sendId}`
  console.log(`[Email] Tracking pixel URL: ${trackingPixelUrl}`)
  const bodyWithTracking = `${draft.body || ''}\n\n<img src="${trackingPixelUrl}" width="1" height="1" alt="" />`

  // 根据 EMAIL_PROVIDER 选择邮件配置
  const provider = process.env.EMAIL_PROVIDER || "smtp"
  
  let smtpHost: string
  let smtpPort: number
  let smtpUser: string
  let smtpPass: string
  let fromEmail: string
  let fromName: string

  if (provider === "qq") {
    smtpHost = process.env.AUTH_EMAIL_SMTP_HOST_QQ || "smtp.qq.com"
    smtpPort = parseInt(process.env.AUTH_EMAIL_SMTP_PORT_QQ || "587")
    smtpUser = process.env.AUTH_EMAIL_USER_QQ || ""
    smtpPass = process.env.AUTH_EMAIL_PASSWORD_QQ || ""
    fromEmail = process.env.AUTH_EMAIL_FROM_QQ || smtpUser
    fromName = process.env.AUTH_EMAIL_NAME_QQ || "MornHub"
  } else if (provider === "126") {
    smtpHost = process.env.AUTH_EMAIL_SMTP_HOST_126 || "smtp.126.com"
    smtpPort = parseInt(process.env.AUTH_EMAIL_SMTP_PORT_126 || "465")
    smtpUser = process.env.AUTH_EMAIL_USER_126 || ""
    smtpPass = process.env.AUTH_EMAIL_PASSWORD_126 || ""
    fromEmail = process.env.AUTH_EMAIL_FROM_126 || smtpUser
    fromName = process.env.AUTH_EMAIL_NAME_126 || "MornHub"
  } else if (provider === "gmail") {
    smtpHost = process.env.AUTH_EMAIL_SMTP_HOST_GMAIL || "smtp.gmail.com"
    smtpPort = parseInt(process.env.AUTH_EMAIL_SMTP_PORT_GMAIL || "587")
    smtpUser = process.env.AUTH_EMAIL_USER_GMAIL || ""
    smtpPass = process.env.AUTH_EMAIL_PASSWORD_GMAIL || ""
    fromEmail = process.env.AUTH_EMAIL_FROM_GMAIL || smtpUser
    fromName = process.env.AUTH_EMAIL_NAME_GMAIL || "MornHub"
  } else {
    smtpHost = process.env.AUTH_EMAIL_SMTP_HOST || "smtp.qq.com"
    smtpPort = parseInt(process.env.AUTH_EMAIL_SMTP_PORT || "587")
    smtpUser = process.env.AUTH_EMAIL_USER || process.env.AUTH_EMAIL_SMTP_USER || ""
    smtpPass = process.env.AUTH_EMAIL_PASSWORD || process.env.AUTH_EMAIL_SMTP_PASS || ""
    fromEmail = process.env.AUTH_EMAIL_FROM || smtpUser
    fromName = process.env.AUTH_EMAIL_NAME || "MornHub"
  }

  if (!smtpUser || !smtpPass) {
    throw new Error("邮件发送配置未完成")
  }

  console.log(`[Email] Using provider: ${provider}, host: ${smtpHost}:${smtpPort}`)

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  })

  const messageId = `<${sendId}@mornhub.top>`
  
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: draft.customer_email,
    subject: draft.subject,
    text: bodyWithTracking,
    html: bodyWithTracking.replace(/\n/g, '<br/>'),
    headers: {
      'Message-ID': messageId
    }
  })
  
  console.log(`[Email] Message-ID: ${messageId}`)

  console.log(`[Email] Attempting to insert send record with sendId: ${sendId}`)
  console.log(`[Email] Draft info: id=${draft.id}, user_id=${draft.user_id}, customer_id=${draft.customer_id}, customer_email=${draft.customer_email}`)
  
  try {
    const result = await dbAdapter.insertRow("ai_customer_email_sends", {
      id: sendId,
      draft_id: draft.id,
      user_id: draft.user_id,
      customer_id: draft.customer_id,
      from_email: fromEmail,
      to_email: draft.customer_email,
      subject: draft.subject,
      body: draft.body,
      status: "sent",
      send_time: new Date().toISOString(),
      tracking_pixel: `track_${sendId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    console.log(`[Email] Send record inserted successfully: ${sendId}`)
    console.log(`[Email] Insert result:`, JSON.stringify(result))
  } catch (insertError: any) {
    console.error(`[Email] Failed to insert send record: ${sendId}`)
    console.error(`[Email] Error message: ${insertError.message}`)
    console.error(`[Email] Error stack:`, insertError.stack)
    throw new Error(`发送记录保存失败: ${insertError.message}`)
  }
}
