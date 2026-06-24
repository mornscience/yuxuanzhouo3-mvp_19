import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/market/db-adapter"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { draftId, subject, body: emailBody } = body

    // 获取草稿
    const draftRows = await dbAdapter.loadRows("ai_customer_email_drafts", { id: draftId })
    if (draftRows.length === 0) {
      return NextResponse.json({ ok: false, message: "Draft not found" }, { status: 404 })
    }

    const draft = draftRows[0]
    
    // 使用用户编辑后的内容，如果没有提供则使用草稿内容
    const finalSubject = subject || draft.subject
    const finalBody = emailBody || draft.body

    // 获取可用的代理邮箱
    const proxyEmails = await dbAdapter.loadRows("proxy_emails", { status: "active" })
    if (proxyEmails.length === 0) {
      return NextResponse.json({ ok: false, message: "No available proxy email" }, { status: 503 })
    }

    // 选择今日发送量最少的邮箱
    const sortedProxies = [...proxyEmails].sort((a, b) => 
      (a.today_sent || 0) - (b.today_sent || 0)
    )
    const selectedProxy = sortedProxies[0]

    // 检查配额
    if ((selectedProxy.today_sent || 0) >= (selectedProxy.daily_quota || 100)) {
      // 标记此邮箱配额用尽
      await dbAdapter.updateRow("proxy_emails", { id: selectedProxy.id }, {
        status: "quota_exceeded",
        updated_at: new Date().toISOString()
      })
      return NextResponse.json({ ok: false, message: "All proxy emails have exceeded daily quota" }, { status: 503 })
    }

    // 创建发送记录
    const sendId = `send_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const trackingPixel = `track_${sendId}`

    // 构建追踪像素
    const trackingPixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/market/email/track/open?sendId=${sendId}`
    const bodyWithTracking = `${finalBody || ''}\n\n<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" />`

    // 发送邮件
    const transporter = nodemailer.createTransport({
      host: selectedProxy.smtp_host || "smtp.gmail.com",
      port: selectedProxy.smtp_port || 587,
      secure: false,
      auth: {
        user: selectedProxy.email,
        pass: selectedProxy.password
      }
    })

    const messageId = `<${sendId}@mornhub.top>`    
    // 设置 References 头，便于回复追踪
    const threadHeaders: Record<string, string> = {
      'Message-ID': messageId
    }
    
    // 使用代理邮箱作为发件人
    const fromEmail = selectedProxy.email
    const fromName = process.env.AUTH_EMAIL_NAME || "MornHub"
    
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: draft.customer_email,
      subject: finalSubject,
      text: bodyWithTracking,
      html: bodyWithTracking.replace(/\n/g, '<br/>'),
      headers: {
        'Message-ID': messageId,
        // 使用 X-Send-Id 自定义头，不会被邮件服务商覆盖，用于追踪回复
        'X-Send-Id': sendId,
        'In-Reply-To': messageId,
        'References': messageId
      }
    })

    // 更新代理邮箱今日发送数
    await dbAdapter.updateRow("proxy_emails", { id: selectedProxy.id }, {
      today_sent: (selectedProxy.today_sent || 0) + 1,
      updated_at: new Date().toISOString()
    })

    // 保存发送记录
    await dbAdapter.insertRow("ai_customer_email_sends", {
      id: sendId,
      draft_id: draftId,
      user_id: userId,
      from_email: selectedProxy.email,
      to_email: draft.customer_email,
      subject: finalSubject,
      body: finalBody,
      status: "sent",
      send_time: new Date().toISOString(),
      tracking_pixel: trackingPixel,
      created_at: new Date().toISOString()
    })

    // 更新草稿状态
    await dbAdapter.updateRow("ai_customer_email_drafts", { id: draftId }, {
      status: "sent",
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      ok: true,
      message: "Email sent successfully",
      sendId
    })

  } catch (error: any) {
    console.error("Email send error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "Failed to send email"
    }, { status: 500 })
  }
}
