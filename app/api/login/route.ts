import { NextResponse } from "next/server"
import { appendSubmission } from "@/lib/submissions-store"

type LoginPayload = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as LoginPayload
  const email = body.email?.trim()
  const password = body.password ?? ""

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Please provide a valid email." }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ ok: false, message: "Password must be at least 6 characters." }, { status: 400 })
  }

  await appendSubmission("login", { email })

  return NextResponse.json({
    ok: true,
    message: "Login request accepted. Connect this endpoint to your auth provider.",
    user: { email },
  })
}
