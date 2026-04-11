import { NextResponse } from "next/server"
import { appendSubmission } from "@/lib/submissions-store"

type LaunchPayload = {
  projectName?: string
  website?: string
  stage?: string
  goal?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as LaunchPayload
  const projectName = body.projectName?.trim() ?? ""
  const website = body.website?.trim() ?? ""
  const stage = body.stage?.trim() ?? ""
  const goal = body.goal?.trim() ?? ""

  if (!projectName || !stage || !goal) {
    return NextResponse.json({ ok: false, message: "Project name, stage, and 90-day goal are required." }, { status: 400 })
  }

  if (website && !/^https?:\/\//.test(website)) {
    return NextResponse.json({ ok: false, message: "Website must start with http:// or https://." }, { status: 400 })
  }

  await appendSubmission("launch", { projectName, website, stage, goal })

  return NextResponse.json({
    ok: true,
    message: "Launch request received.",
    data: { projectName, website, stage, goal },
  })
}
