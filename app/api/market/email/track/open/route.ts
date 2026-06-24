import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const sendId = url.searchParams.get("sendId")
    
    // 调试日志：记录请求
    console.log("[Email Tracking] Open tracking request received")
    console.log("[Email Tracking] sendId:", sendId)
    console.log("[Email Tracking] Request URL:", request.url)
    
    if (!sendId) {
      console.log("[Email Tracking] Error: sendId is missing")
      return new Response(null, { status: 400 })
    }

    const sendRows = await dbAdapter.loadRows("ai_customer_email_sends", { id: sendId })
    console.log("[Email Tracking] Found send records:", sendRows.length)
    
    if (sendRows.length > 0) {
      const sendRecord = sendRows[0]
      console.log("[Email Tracking] Found send record:", sendRecord.id)
      console.log("[Email Tracking] Current status:", sendRecord.status)
      
      if (!sendRecord.open_time) {
        console.log("[Email Tracking] Updating status to opened...")
        await dbAdapter.updateRow("ai_customer_email_sends", { id: sendId }, {
          status: "opened",
          open_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        console.log("[Email Tracking] Status updated to 'opened' successfully")
      } else {
        console.log("[Email Tracking] Email already opened at:", sendRecord.open_time)
      }
    } else {
      console.log("[Email Tracking] Error: No send record found for sendId:", sendId)
      console.log("[Email Tracking] Attempting to create missing send record...")
      
      try {
        // 解析 sendId 获取 userId
        const match = sendId.match(/^send_([^_]+)_/)
        const userId = match ? match[1] : "unknown"
        
        await dbAdapter.insertRow("ai_customer_email_sends", {
          id: sendId,
          user_id: userId,
          status: "opened",
          open_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        console.log("[Email Tracking] Created missing send record successfully:", sendId)
      } catch (createError) {
        console.error("[Email Tracking] Failed to create missing send record:", createError.message)
      }
    }

    const gifData = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
      0x44, 0x01, 0x00, 0x3B
    ])
    
    return new Response(gifData, {
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": gifData.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    })

  } catch (error) {
    console.error("[Email Tracking] Open tracking error:", error)
    return new Response(null, { status: 200 })
  }
}