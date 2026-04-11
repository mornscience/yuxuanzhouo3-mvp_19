import { NextResponse } from "next/server"
import { appendSubmission } from "@/lib/submissions-store"

type CapitalPayload = {
  company?: string
  contactEmail?: string
  raiseAmount?: string
  timeline?: string
  story?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as CapitalPayload
  const company = body.company?.trim() ?? ""
  const contactEmail = body.contactEmail?.trim() ?? ""
  const raiseAmount = body.raiseAmount?.trim() ?? ""
  const timeline = body.timeline?.trim() ?? ""
  const story = body.story?.trim() ?? ""

  if (!company || !contactEmail || !raiseAmount || !timeline || !story) {
    return NextResponse.json({ ok: false, message: "All fields are required." }, { status: 400 })
  }

  if (!contactEmail.includes("@")) {
    return NextResponse.json({ ok: false, message: "Please provide a valid contact email." }, { status: 400 })
  }

  await appendSubmission("connect-capital", { company, contactEmail, raiseAmount, timeline, story })

  return NextResponse.json({
    ok: true,
    message: "Capital profile submitted.",
    data: { company, contactEmail, raiseAmount, timeline, story },
  })
}
