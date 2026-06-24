import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"
import { checkEmailReplies } from "@/lib/market/email-reply-checker"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log("[Email Tracking] Reply tracking request received")
    console.log("[Email Tracking] Reply data:", JSON.stringify(body, null, 2))
    
    const { sendId, fromEmail, subject, body: replyBody, receivedTime, action } = body
    
    // 如果action是check，则触发邮箱检查
    if (action === "check") {
      console.log("[Email Tracking] Triggering email reply check...")
      const result = await checkEmailReplies(request)
      return NextResponse.json({
        ok: result.success,
        message: result.success 
          ? `检查完成。找到 ${result.found} 封回复邮件，处理了 ${result.processed} 封。`
          : "邮箱检查失败",
        data: result
      })
    }
    
    if (!sendId) {
      console.log("[Email Tracking] Error: sendId is missing")
      return NextResponse.json({ ok: false, message: "sendId is required" }, { status: 400 })
    }

    const sendRows = await dbAdapter.loadRows("ai_customer_email_sends", { id: sendId })
    console.log("[Email Tracking] Found send records for reply:", sendRows.length)
    
    if (sendRows.length > 0) {
      const sendRecord = sendRows[0]
      console.log("[Email Tracking] Found send record:", sendRecord.id)
      console.log("[Email Tracking] Current reply_time:", sendRecord.reply_time)
      
      if (!sendRecord.reply_time) {
        console.log("[Email Tracking] Updating status to replied...")
        await dbAdapter.updateRow("ai_customer_email_sends", { id: sendId }, {
          status: "replied",
          reply_time: receivedTime || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        console.log("[Email Tracking] Status updated to 'replied' successfully")
        
        return NextResponse.json({
          ok: true,
          message: "Reply recorded successfully",
          sendId
        })
      } else {
        console.log("[Email Tracking] Email already replied at:", sendRecord.reply_time)
        return NextResponse.json({
          ok: true,
          message: "Reply already recorded",
          sendId
        })
      }
    } else {
      console.log("[Email Tracking] Error: No send record found for sendId:", sendId)
      return NextResponse.json({ ok: false, message: "Send record not found" }, { status: 404 })
    }

  } catch (error) {
    console.error("[Email Tracking] Reply tracking error:", error)
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const sendId = url.searchParams.get("sendId")
    const action = url.searchParams.get("action")
    
    // 如果action是check，则触发邮箱检查
    if (action === "check") {
      console.log("[Email Tracking] Triggering email reply check via GET...")
      const result = await checkEmailReplies(request)
      return NextResponse.json({
        ok: result.success,
        message: result.success 
          ? `检查完成。找到 ${result.found} 封回复邮件，处理了 ${result.processed} 封。`
          : "邮箱检查失败",
        data: result
      })
    }
    
    console.log("[Email Tracking] Reply tracking GET request received")
    console.log("[Email Tracking] sendId:", sendId)
    
    if (!sendId) {
      return NextResponse.json({ ok: false, message: "sendId is required" }, { status: 400 })
    }

    const sendRows = await dbAdapter.loadRows("ai_customer_email_sends", { id: sendId })
    
    if (sendRows.length > 0) {
      const sendRecord = sendRows[0]
      return NextResponse.json({
        ok: true,
        data: {
          sendId: sendRecord.id,
          status: sendRecord.status,
          replyTime: sendRecord.reply_time,
          toEmail: sendRecord.to_email,
          subject: sendRecord.subject
        }
      })
    } else {
      return NextResponse.json({ ok: false, message: "Send record not found" }, { status: 404 })
    }

  } catch (error) {
    console.error("[Email Tracking] Reply tracking GET error:", error)
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 })
  }
}
