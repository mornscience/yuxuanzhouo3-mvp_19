import { NextResponse } from "next/server"
import { callRoutedAI } from "@/lib/ai/router"
import { streamResponse, streamAsyncCharacters } from "@/lib/http/stream"
import type { AIRequest } from "@/lib/ai/types"

type ReviewMode = "diff" | "file" | "pr"

export async function POST(req: Request) {
  const body = (await req.json()) as {
    mode?: ReviewMode
    code?: string
    diff?: string
    title?: string
    language?: string
  }

  const mode: ReviewMode = body.mode ?? (body.diff ? "diff" : "file")
  const language = body.language ?? "TypeScript"
  const code = body.code ?? ""
  const diff = body.diff ?? ""
  const title = body.title ?? "Code Review"

  const url = new URL(req.url)
  const streamParam = url.searchParams.get("stream")
  const streamHeader = new Headers(req.headers).get("x-stream")
  const wantStream = streamParam === "1" || streamHeader === "1" || streamParam === "sse" || streamHeader === "sse"
  const useSse = streamParam === "sse" || streamHeader === "sse"
  const regionHeader = new Headers(req.headers).get("x-region") || process.env.NEXT_PUBLIC_SITE_REGION || "cn"
  const region = regionHeader === "intl" ? "intl" : "cn"

  const input = buildReviewPrompt({ mode, language, code, diff, title })
  const model = pickReviewModel(region)
  const system = getSystemPrompt(language)

  try {
    const aiReq: AIRequest & { region: "cn" | "intl" } = {
      model,
      input,
      system,
      temperature: 0.2,
      maxTokens: 1600,
      userId: "anon",
      projectId: "default",
      region,
    }
    if (wantStream) {
      return streamAsyncCharacters(
        async () => {
          const res = await callRoutedAI(aiReq)
          return res.text
        },
        { delayMs: 8, contentType: useSse ? "sse" : "text", keepAliveMs: 400 },
      )
    }
    const res = await callRoutedAI(aiReq)
    return NextResponse.json({ ok: true, provider: res.provider, result: res.text })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: errMsg }, { status: 200 })
  }
}

function getSystemPrompt(language: string) {
  return [
    `You are a meticulous senior ${language} reviewer.`,
    "Output must be concise, prioritized, and actionable.",
    "Prefer bullet lists with short code suggestions when needed.",
    "Label severities as: [critical] [major] [minor] [nit].",
    "Never change behavior unless the issue is correctness or security.",
    "Keep tone polite and professional; respond in the user's language (CN/EN).",
  ].join(" ")
}

function buildReviewPrompt(ctx: {
  mode: ReviewMode
  language: string
  code: string
  diff: string
  title: string
}) {
  const { mode, language, code, diff, title } = ctx
  const header = `Title: ${title}\nLanguage: ${language}`

  if (mode === "diff") {
    return `${header}

Please review the following unified diff. Focus on: correctness, types, security, performance, readability, and DX. Point to exact hunks when possible and suggest minimal edits.

--- BEGIN DIFF ---
${diff}
--- END DIFF ---

Required Sections:
- Summary (2-4 bullets)
- Risks (critical/major)
- Suggested Edits (inline code snippets)
- Tests to Add (if any)`
  }

  // file / pr fall back to full-file review
  return `${header}

Please review the following file content.

--- BEGIN FILE ---
${code}
--- END FILE ---

Provide:
- Summary
- Issues grouped by severity
- Concrete code suggestions
- Quick refactor opportunities`
}

function pickReviewModel(region: "cn" | "intl") {
  // allow env override
  const regionKey = `REVIEW_MODEL_${region.toUpperCase()}`
  const specific = process.env[regionKey]
  if (specific) return specific
  const global = process.env.REVIEW_MODEL || process.env.DEFAULT_MODEL
  if (global) return global
  return region === "cn" ? "qwen-coder-turbo" : "gpt-4o-mini"
}

