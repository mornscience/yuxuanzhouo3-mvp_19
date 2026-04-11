import { NextResponse } from "next/server"
import { addMemory, listMemory } from "@/lib/memory/store"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const projectId = url.searchParams.get("projectId") || "default"
  const limit = Number(url.searchParams.get("limit") || "50")
  const items = listMemory(projectId, Math.max(1, Math.min(200, limit)))
  return NextResponse.json({ ok: true, items })
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    projectId?: string
    userId?: string
    type?: "decision" | "constraint" | "todo" | "note"
    content: string
  }
  const projectId = body.projectId ?? "default"
  const userId = body.userId ?? "anon"
  const type = body.type ?? "note"
  const item = addMemory({ projectId, userId, type, content: body.content })
  return NextResponse.json({ ok: true, item })
}

