import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { callRoutedAI } from "@/lib/ai/router"
import { recentContextText } from "@/lib/memory/store"
import { streamResponse, streamAsyncCharacters } from "@/lib/http/stream"
import type { AIRequest } from "@/lib/ai/types"

type Mode = "complete" | "refactor" | "explain" | "chat"

export async function POST(req: Request) {
  console.log(`[AI-Coder] API request received`)
  const body = (await req.json()) as {
    mode: Mode
    code?: string
    prompt?: string
    language?: string
  }

  const mode = body.mode
  const code = body.code ?? ""
  const prompt = body.prompt ?? ""
  const language = body.language ?? "TypeScript"

  console.log(`[AI-Coder] Mode: ${mode}, Language: ${language}, Code length: ${code.length}, Prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`)
  const url = new URL(req.url)
  const streamParam = url.searchParams.get("stream")
  const streamHeader = new Headers(req.headers).get("x-stream")
  const wantStream = streamParam === "1" || streamHeader === "1" || streamParam === "sse" || streamHeader === "sse"
  const useSse = streamParam === "sse" || streamHeader === "sse"

  // ----- 简易缓存（避免重复计费） -----
  const cacheKey = makeCacheKey({ mode, code, prompt, language })
  const cached = getCache(cacheKey)
  if (cached) {
    console.log(`[AI-Coder] Cache hit for key: ${cacheKey}`)
    if (wantStream) return streamResponse(cached.result, { delayMs: 8, contentType: useSse ? "sse" : "text" })
    return NextResponse.json({ ok: true, provider: "cache", result: cached.result })
  }
  console.log(`[AI-Coder] Cache miss, key: ${cacheKey}`)

  // Region 判定（前端 NEXT_PUBLIC_SITE_REGION 或请求头）
  const regionHeader = new Headers(req.headers).get("x-region") || process.env.NEXT_PUBLIC_SITE_REGION || "cn"
  const region = regionHeader === "intl" ? "intl" : "cn"
  console.log(`[AI-Coder] Region: ${region}, Header: ${regionHeader}, NEXT_PUBLIC_SITE_REGION: ${process.env.NEXT_PUBLIC_SITE_REGION}`)

  // 检查是否有可用的API密钥
  const hasAliyunKey = !!process.env.ALIYUN_DASHSCOPE_API_KEY
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY
  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY
  console.log(
    `[AI-Coder] API keys - Aliyun: ${hasAliyunKey ? "PRESENT" : "MISSING"}, OpenAI: ${hasOpenAIKey ? "PRESENT" : "MISSING"}, OpenRouter: ${hasOpenRouterKey ? "PRESENT" : "MISSING"}`,
  )

  // 如果没有配置任何API密钥，返回模拟结果
  if (!hasAliyunKey && !hasOpenAIKey && !hasOpenRouterKey) {
    console.log(`[AI-Coder] No API keys configured, returning mock result`)
    const mockResult = getMockResult(mode, { code, prompt, language })
    setCache(cacheKey, mockResult)
    return NextResponse.json({ ok: true, provider: "mock", result: mockResult })
  }

  try {
    // 统一路由调用
    const userId = "anon" // 可从会话里取
    const projectId = "default"
    const projectContext = recentContextText(projectId, 20)
    // 简单语言检测：含有中文字符则优先中文；否则根据 region 选择（cn→中文，intl→英文）
    const preferZh = /[\u4e00-\u9fa5]/.test(prompt) || region === "cn"
    const naturalLang = preferZh ? "Chinese" : "English"
    const input = projectContext + buildUserPrompt(mode, { code, prompt, language, naturalLang })
    const model = pickModel(mode, region)
    const system = getSystemPrompt(mode, language, naturalLang)
    console.log(`[AI-Coder] Model selected: ${model}, Region: ${region}`)
    const maxTokens = maxTokensForMode(mode)
    const aiReq: AIRequest & { region: "cn" | "intl" } = {
      model,
      input,
      system,
      temperature: mode === "chat" || mode === "explain" ? 0.4 : 0.25,
      maxTokens,
      userId,
      projectId,
      region,
    }
    console.log(`[AI-Coder] Calling routed AI with input length: ${input.length}, region: ${region}`)
    if (wantStream) {
      // 打开连接，等待结果后逐字输出
      return streamAsyncCharacters(
        async () => {
          const res = await callRoutedAI(aiReq)
          console.log(`[AI-Coder] AI response received from provider: ${res.provider}, text length: ${res.text.length}`)
          const result = res.text
          setCache(cacheKey, result)
          return result
        },
        { delayMs: 8, contentType: useSse ? "sse" : "text", keepAliveMs: 400 },
      )
    }
    const res = await callRoutedAI(aiReq)
    console.log(`[AI-Coder] AI response received from provider: ${res.provider}, text length: ${res.text.length}`)
    const result = res.text
    setCache(cacheKey, result)
    return NextResponse.json({ ok: true, provider: res.provider, result })
  } catch (err) {
    // 密钥已配置但上游仍失败：网络、额度、模型不可用、某家全挂等——与「未配置密钥」不同，勿用同一套提示误导用户
    console.error(`[AI-Coder] Error calling AI API:`, err)
    const errMsg = err instanceof Error ? err.message : String(err)
    const mockResult = formatFallbackAfterApiError(errMsg, getMockResult(mode, { code, prompt, language }))
    setCache(cacheKey, mockResult)
    if (wantStream) return streamResponse(mockResult, { delayMs: 8, contentType: useSse ? "sse" : "text" })
    return NextResponse.json({
      ok: true,
      provider: "mock_fallback",
      result: mockResult,
      error: errMsg,
    })
  }
}

// ----- 费用守护：缓存实现（内存 LRU 简化） -----
type CacheEntry = { result: string; time: number }
const CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 天
const CACHE_MAX = 500 // 最多缓存 500 条

function makeCacheKey(obj: object) {
  const raw = JSON.stringify(obj)
  return crypto.createHash("sha1").update(raw).digest("hex")
}
function getCache(key: string): CacheEntry | null {
  const hit = CACHE.get(key)
  if (!hit) return null
  if (Date.now() - hit.time > CACHE_TTL_MS) {
    CACHE.delete(key)
    return null
  }
  // 触碰提升
  CACHE.delete(key)
  CACHE.set(key, hit)
  return hit
}
function setCache(key: string, result: string) {
  if (CACHE.size >= CACHE_MAX) {
    const first = CACHE.keys().next().value
    if (first) CACHE.delete(first)
  }
  CACHE.set(key, { result, time: Date.now() })
}

/** 上限越低，平均生成越快；不足时可再调高 */
function maxTokensForMode(mode: Mode): number {
  switch (mode) {
    case "chat":
      return 1200
    case "explain":
      return 1600
    case "complete":
    case "refactor":
      return 1400
    default:
      return 1500
  }
}

function getSystemPrompt(mode: Mode, language: string, naturalLang: "Chinese" | "English") {
  const lang = `Use ${naturalLang} for any natural-language parts (comments, JSDoc, explanations). If the user's message is Chinese, strictly write comments and docstrings in Chinese.`
  switch (mode) {
    case "complete":
      return `You are an expert ${language} engineer. Output production-ready code with brief inline comments where helpful. ${lang}`
    case "refactor":
      return `You are an expert ${language} engineer. Refactor for clarity and types; preserve behavior. ${lang}`
    case "explain":
      return `You are a senior TypeScript/JavaScript expert. Explain code clearly with headings or numbered steps. Cover generics, control flow, and any timers/IDs when present. ${lang}`
    case "chat":
      return `You are a senior programming mentor. Give accurate, structured answers (comparison tables or bullet lists when comparing concepts). ${lang}`
  }
}

function pickModel(mode: Mode, region: string) {
  // Check for region-specific forced model from environment variables
  // Support DEFAULT_MODEL_CN and DEFAULT_MODEL_INTL for per-region control
  const regionSpecificKey = `DEFAULT_MODEL_${region.toUpperCase()}`
  const regionSpecificModel = process.env[regionSpecificKey]

  if (regionSpecificModel) {
    console.log(`[AI-Coder] Using region-specific model from ${regionSpecificKey}: ${regionSpecificModel}`)
    return regionSpecificModel
  }

  // Fallback to global DEFAULT_MODEL if no region-specific setting
  const globalModel = process.env.DEFAULT_MODEL
  if (globalModel) {
    console.log(`[AI-Coder] Using global model from DEFAULT_MODEL env: ${globalModel}`)
    return globalModel
  }

  // Default model selection based on region and mode
  if (region === "cn") {
    if (mode === "complete" || mode === "refactor") return "qwen-coder-turbo"
    // 对话 / 解释：轻量模型，降低首包与总耗时（补全/重构仍用 coder）
    if (mode === "chat" || mode === "explain") return "qwen2.5-lite"
    return "qwen2.5-coder"
  }
  // intl：统一 gpt-4o-mini，延迟与成本较均衡
  return "gpt-4o-mini"
}

function buildUserPrompt(
  mode: Mode,
  ctx: { code: string; prompt: string; language: string; naturalLang: "Chinese" | "English" },
) {
  const { code, prompt, language, naturalLang } = ctx
  if (mode === "chat") {
    return `用户问题：\n${prompt}\n\n回答要求：\n- 与用户使用相同语言（中文问题用中文答）。\n- 若涉及 TypeScript 的 interface 与 type 对比：请分点说明声明合并（declaration merging）、扩展方式（extends vs 交叉类型）、联合类型/元组等更适合用 type 的场景，并给出实践建议（例如 interface 适合描述可扩展对象结构；type 适合联合类型、映射类型、条件类型等）。\n- 条理清晰，必要时使用小节标题或列表。`
  }
  if (mode === "complete") {
    return `Language: ${language}\nUser Request: ${prompt}\n\nGenerate complete, production-ready code including:
- Full function/class implementation with proper type annotations
- Clear JSDoc comments describing parameters and return value (write these in ${naturalLang})
- Error handling if applicable
- Export statements if needed
- Follow ${language} best practices

Output only code (and brief code comments). No surrounding prose outside the code block. All comments and docstrings must be written in ${naturalLang}.`
  }
  if (mode === "refactor") {
    return `Language: ${language}\nRefactor the following code:\n\n${code}\n\nFocus on:
- Improving readability and maintainability
- Following ${language} best practices
- Adding or improving type annotations
- Optimizing performance if applicable
- Adding meaningful comments for changes made (use ${naturalLang})
- Preserving original functionality

Output the refactored code with inline comments explaining key changes, using ${naturalLang}.`
  }
  // explain
  return `编程语言上下文: ${language}

用户粘贴的代码与说明（可混在同一文本中）：

---
${code}
---

请分节说明（若用户使用中文，请用中文回答）。在相关时必须覆盖：

1. **泛型**：每个类型参数的作用（例如泛型 \`T\` 如何配合 \`Parameters<T>\` 等工具类型，保留原函数的参数类型与返回值类型信息）。

2. **状态变量（如 timeoutId）**：保存的是什么（例如定时器句柄）、为何可能为 \`null\`、在防抖/节流场景下如何通过「清除旧定时器 → 设置新定时器」实现多次触发只执行最后一次。

3. **执行流程**：按时间顺序分步写清（例如：清除旧定时器 → 新建延迟调用 → 延迟结束后执行原函数）。

若不是防抖代码，也请按「泛型（若有）→ 关键变量 → 控制流」的结构解释。`
}

function getMockResult(
  mode: Mode,
  ctx: { code: string; prompt: string; language: string },
) {
  const { code, prompt } = ctx
  const blob = `${code}\n${prompt}`

  if (mode === "explain" && /debounce/i.test(blob) && /timeoutId/i.test(blob)) {
    return `【泛型 T】
T 被约束为「任意可调用的函数类型」。这样 debounce 返回的新函数在调用时，参数会通过 \`Parameters<T>\` 与原函数保持一致，从而在类型层面保留「原函数入参与返回值」信息，而不是退化为 any。

【timeoutId】
用于保存 \`setTimeout\` 返回的定时器 ID（在浏览器/Node 下类型多为 number 或 NodeJS.Timeout）。每次再次触发时先 \`clearTimeout(timeoutId)\`，避免上一次延迟仍在排队，从而实现「多次触发只执行最后一次」的防抖语义。

【执行流程】
1) 外层返回闭包函数；2) 每次调用若已有 timeoutId 则清除旧定时器；3) 重新 setTimeout，在 delay 毫秒后执行原函数并传入本次参数；4) 多次快速调用只会保留最后一次安排的延迟任务。`
  }

  const asksInterfaceVsTypeAlias =
    /\binterface\b/i.test(prompt) &&
    (/\btype\s+alias\b|类型别名|interface\s+和\s+type|interface\s+与\s+type|interface\s+跟\s+type/i.test(prompt))

  if (mode === "chat" && asksInterfaceVsTypeAlias) {
    return `【interface 与 type 的主要差异】
• 声明合并：interface 支持同名合并；type 不支持同名合并。
• 扩展：interface 用 extends；type 用交叉类型 & 或工具类型组合。
• 联合/元组/映射：复杂联合、条件类型等通常用 type 更自然。

【使用建议】
• interface：适合描述「对象形状」、对外 API、可被扩展的模型（也可配合声明合并）。
• type：适合联合类型、交叉组合、映射类型、条件类型，以及需要 typeof / 工具类型推导的别名。

（说明：若你未配置任何 API 密钥，会一直看到本页内置短文。若已配置密钥仍看到本段，说明本次在线调用失败，请查看运行 next 的终端里 [AI-Coder] / [AI-Router] / 上游返回的错误信息。）`
  }

  switch (mode) {
    case "complete":
      return `// （离线模拟）请配置 ALIYUN_DASHSCOPE_API_KEY 或 OPENAI_API_KEY 以生成真实补全\n// 需求摘要: ${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}\nexport function placeholder() {\n  throw new Error("Configure AI API keys for real completions");\n}\n`
    case "refactor":
      return `// （离线模拟）重构预览\n${code.replace(/var /g, "const ")}`
    case "explain":
      return `（离线模拟）请配置 API 密钥以获得针对你代码的逐步解释。\n\n简要结构提示：先说明整体目的，再按「泛型 → 关键变量 → 执行顺序」展开。`
    case "chat":
      return `（离线模拟）请配置 API 密钥以启用编程问答。\n若问题涉及 TypeScript，可对比 interface 与 type 的合并与扩展能力，并说明各自适用场景。`
  }
}

/** 在已配置密钥但调用失败时，把原因放在正文顶部，避免与「未配密钥」混淆 */
function formatFallbackAfterApiError(errMsg: string, mockBody: string): string {
  return `【本次未接通在线模型】原因摘要：${errMsg}

以下为本地占位内容，不是模型生成结果。
────────────────────────
${mockBody}`
}

