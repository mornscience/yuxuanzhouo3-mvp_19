import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"

export async function POST(request: Request) {
  try {
    console.log("[Email Migration] Starting database migration...")
    
    await dbAdapter.execute(`ALTER TABLE ai_customer_email_sends ALTER COLUMN customer_id TYPE VARCHAR(50);`)
    console.log("[Email Migration] Updated ai_customer_email_sends.customer_id to VARCHAR(50)")
    
    await dbAdapter.execute(`ALTER TABLE ai_customer_email_drafts ALTER COLUMN customer_id TYPE VARCHAR(50);`)
    console.log("[Email Migration] Updated ai_customer_email_drafts.customer_id to VARCHAR(50)")
    
    // 添加回复相关字段
    try {
      await dbAdapter.execute(`ALTER TABLE ai_customer_email_sends ADD COLUMN IF NOT EXISTS reply_from TEXT;`)
      console.log("[Email Migration] Added reply_from column")
      
      await dbAdapter.execute(`ALTER TABLE ai_customer_email_sends ADD COLUMN IF NOT EXISTS reply_body TEXT;`)
      console.log("[Email Migration] Added reply_body column")
    } catch (e) {
      console.log("[Email Migration] Columns may already exist:", e)
    }
    
    return NextResponse.json({
      ok: true,
      message: "数据库迁移完成"
    })
    
  } catch (error: any) {
    console.error("[Email Migration] Error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "数据库迁移失败"
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return NextResponse.json({
    ok: true,
    message: "POST /api/market/email/migrate 来执行数据库迁移"
  })
}
