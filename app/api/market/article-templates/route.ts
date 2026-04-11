import { NextRequest, NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"
import { randomUUID } from "crypto"

function getUserId(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })
  try {
    const body = await request.json()
    const { action, id, title, content, images, tags } = body

    if (action === "create") {
      if (!title?.trim()) return NextResponse.json({ ok: false, message: "标题不能为空" }, { status: 400 })
      const row = await dbAdapter.insertRow("article_templates", {
        id: `art-${randomUUID().slice(0, 8)}`,
        userId, title, content: content || "", images: images || "", tags: tags || "",
      })
      return NextResponse.json({ ok: true, data: row })
    }

    if (action === "update") {
      if (!id) return NextResponse.json({ ok: false, message: "缺少 id" }, { status: 400 })
      const row = await dbAdapter.updateRow("article_templates", { id, userId }, { title, content, images, tags })
      return NextResponse.json({ ok: true, data: row })
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ ok: false, message: "缺少 id" }, { status: 400 })
      await dbAdapter.deleteRow("article_templates", { id, userId })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, message: "未知操作" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
