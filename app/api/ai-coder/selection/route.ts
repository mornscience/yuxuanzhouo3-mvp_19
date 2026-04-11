import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import type { AIRequest } from "@/lib/ai/types"
import { callRoutedAI } from "@/lib/ai/router"
import { streamResponse, streamAsyncCharacters } from "@/lib/http/stream"
import { recentContextText } from "@/lib/memory/store"

type Mode = "refactor" | "explain" | "complete"

export async function POST(req: Request) {
  const body = (await req.json()) as {
    filePath: string
    startLine: number
    endLine: number
    mode: Mode
    prompt?: string
    language?: string
  }

  const { filePath, startLine, endLine, mode } = body
  const language = body.language ?? "TypeScript"
  const prompt = body.prompt ?? ""

  if (!filePath || !Number.isInteger(startLine) || !Number.isInteger(endLine) || startLine < 1 || endLine < startLine) {
    return NextResponse.json({ ok: false, error: "Invalid filePath or line range" }, { status: 200 })
  }

  // 安全：约束在项目根目录内，避免目录穿越
  const root = process.cwd()
  const abs = path.resolve(root, filePath)
  if (!abs.startsWith(root)) {
    return NextResponse.json({ ok: false, error: "Path is outside project root" }, { status: 200 })
  }
  if (!fs.existsSync(abs)) {
    return NextResponse.json({ ok: false, error: "File not found" }, { status: 200 })
  }
  const text = fs.readFileSync(abs, "utf-8")
  const lines = text.split(/\r?\n/)
  const snippet = lines.slice(startLine - 1, endLine).join("\n")

  // 区域与语言
  const url = new URL(req.url)
  const streamParam = url.searchParams.get("stream")
  const streamHeader = new Headers(req.headers).get("x-stream")
  const wantStream = streamParam === "1" || streamHeader === "1" || streamParam === "sse" || streamHeader === "sse"
  const useSse = streamParam === "sse" || streamHeader === "sse"
  const regionHeader = new Headers(req.headers).get("x-region") || process.env.NEXT_PUBLIC_SITE_REGION || "cn"
  const region: "cn" | "intl" = regionHeader === "intl" ? "intl" : "cn"
  const preferZh = /[\u4e00-\u9fa5]/.test(prompt) || region === "cn"
  const naturalLang: "Chinese" | "English" = preferZh ? "Chinese" : "English"

  // 项目上下文
  const userId = "anon"
  const projectId = "default"
  const projectContext = recentContextText(projectId, 20)

  const input = projectContext + buildPrompt(mode, {
    snippet,
    filePath,
    startLine,
    endLine,
    language,
    prompt,
    naturalLang,
  })
  const model = pickModel(mode, region)
  const system = getSystemPrompt(mode, language, naturalLang)

  try {
    const aiReq: AIRequest & { region: "cn" | "intl" } = {
      model,
      input,
      system,
      temperature: mode === "complete" ? 0.25 : 0.3,
      maxTokens: mode === "explain" ? 1600 : 1400,
      userId,
      projectId,
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

function getSystemPrompt(mode: Mode, language: string, naturalLang: "Chinese" | "English") {
  const lang = `Use ${naturalLang} for all comments, JSDoc, and explanations.`
  switch (mode) {
    case "complete":
      return `You are an expert ${language} engineer. Output production-ready code. ${lang}`
    case "refactor":
      return `You are an expert ${language} engineer. Refactor for clarity, safety, and types while preserving behavior. ${lang}`
    case "explain":
      return `You are a senior ${language} mentor. Explain clearly with headings or numbered steps. ${lang}`
  }
}

function pickModel(mode: Mode, region: "cn" | "intl") {
  const regionKey = `DEFAULT_MODEL_${region.toUpperCase()}`
  const byEnv = process.env[regionKey] || process.env.DEFAULT_MODEL
  if (byEnv) return byEnv
  if (region === "cn") {
    if (mode === "complete" || mode === "refactor") return "qwen-coder-turbo"
    return "qwen2.5-lite"
  }
  return "gpt-4o-mini"
}

function buildPrompt(
  mode: Mode,
  ctx: {
    snippet: string
    filePath: string
    startLine: number
    endLine: number
    language: string
    prompt: string
    naturalLang: "Chinese" | "English"
  },
) {
  const { snippet, filePath, startLine, endLine, language, prompt, naturalLang } = ctx
  const header = `Target File: ${filePath}\nLines: ${startLine}-${endLine}\nLanguage: ${language}\n`

  if (mode === "explain") {
    return `${header}
Please explain the selected code snippet. Use ${naturalLang}. Provide:
1) Purpose overview
2) Key variables & data flow
3) Control flow step-by-step
4) Edge cases and caveats

--- BEGIN SNIPPET ---
${snippet}
--- END SNIPPET ---`
  }

  if (mode === "refactor") {
    return `${header}
Refactor ONLY the selected snippet while preserving behavior. Use ${naturalLang} for inline comments. Prefer clearer naming, stronger typing, early returns, and small pure functions when helpful.

Optional user note: ${prompt || "(none)"}.

--- BEGIN SNIPPET ---
${snippet}
--- END SNIPPET ---

Return the refactored code for this snippet.`
  }

  // complete
  return `${header}
Generate the missing implementation for this snippet request. Use ${naturalLang} for comments and docstrings.
User note: ${prompt || "(none)"}.

--- BEGIN SNIPPET ---
${snippet}
--- END SNIPPET ---`
}

