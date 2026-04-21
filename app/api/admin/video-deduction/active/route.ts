import { NextRequest, NextResponse } from "next/server"
import { getActiveVideo } from "@/actions/admin-video-deduction"

export async function GET(request: NextRequest) {
  try {
    const result = await getActiveVideo()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "服务器错误" },
      { status: 500 }
    )
  }
}