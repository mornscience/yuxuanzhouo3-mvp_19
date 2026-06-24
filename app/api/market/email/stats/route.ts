import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"
import { requireAuth } from "@/lib/api-utils"

export async function GET(request: Request) {
  try {
    const userId = requireAuth(request as any)
    
    const sends = await dbAdapter.loadRows("ai_customer_email_sends", { user_id: userId })
    
    const totalSent = sends.length
    const totalOpened = sends.filter(s => s.open_time).length
    const totalReplied = sends.filter(s => s.reply_time).length
    const avgClickCount = sends.length ? sends.reduce((sum, s) => sum + (s.click_count || 0), 0) / sends.length : 0
    
    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0"
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "0.0"

    const last7Days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const daySends = sends.filter(s => s.send_time?.startsWith(dateStr))
      const dayOpened = daySends.filter(s => s.open_time)
      const dayReplied = daySends.filter(s => s.reply_time)
      
      last7Days.push({
        date: dateStr,
        sent: daySends.length,
        opened: dayOpened.length,
        replied: dayReplied.length
      })
    }

    const recentSends = sends
      .sort((a, b) => new Date(b.send_time).getTime() - new Date(a.send_time).getTime())
      .slice(0, 20)
      .map(s => ({
        id: s.id,
        customerEmail: s.to_email,
        subject: s.subject,
        status: s.status,
        sendTime: s.send_time,
        openTime: s.open_time,
        replyTime: s.reply_time,
        replyFrom: s.reply_from,
        replyBody: s.reply_body,
        clickCount: s.click_count || 0
      }))

    return NextResponse.json({
      ok: true,
      data: {
        overview: {
          totalSent,
          totalOpened,
          totalReplied,
          openRate,
          replyRate,
          avgClickCount: avgClickCount.toFixed(1)
        },
        last7Days,
        recentSends
      }
    })

  } catch (error: any) {
    console.error("[Email Stats] Error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "获取统计数据失败"
    }, { status: 500 })
  }
}