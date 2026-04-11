import { NextResponse } from "next/server"

const TARGET = "http://localhost:3001/api/generate"

export async function POST(req: Request) {
  try {
    const { projectName } = (await req.json()) as { projectName: string }
    if (!projectName) {
      return NextResponse.json({ success: false, message: "projectName 必填" }, { status: 200 })
    }

    const resp = await fetch(TARGET, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName, templateType: "springboot-api" }),
    })

    const text = await resp.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      })
    } catch {
      return NextResponse.json({ success: false, message: text || "Upstream error" }, { status: 200 })
    }
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 200 })
  }
}

