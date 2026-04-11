import type { AIRequest, AIResponse } from "../types"
import { priceOf } from "../pricing"

/** 内部 model 名 → OpenRouter 模型 ID（见 https://openrouter.ai/models） */
function toOpenRouterModelId(internal: string): string {
  const map: Record<string, string> = {
    "gpt-4o-mini": "openai/gpt-4o-mini",
    "gpt-4o": "openai/gpt-4o",
    "qwen-coder-turbo": "qwen/qwen-2.5-coder-32b-instruct",
    "qwen2.5-coder": "qwen/qwen2.5-coder-32b-instruct",
    "qwen2.5-lite": "qwen/qwen2.5-7b-instruct",
  }
  if (map[internal]) return map[internal]
  if (internal.includes("/")) return internal
  return `openai/${internal}`
}

export async function callOpenRouter(req: AIRequest): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured")

  const defaultSystem =
    "You are a helpful coding assistant. Respond in the language preferred by the user. If the user asks for a specific language (e.g., '用中文回答', 'answer in English'), use that language. If no language preference is specified, use the same language as the user's question."
  const messages = [
    { role: "system", content: req.system ?? defaultSystem },
    { role: "user", content: req.input },
  ]

  const internalModel = req.model || "gpt-4o-mini"
  const model = toOpenRouterModelId(internalModel)
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": siteUrl,
      "X-Title": "mvp-ai-coder",
    },
    body: JSON.stringify({
      model,
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens ?? 400,
      messages,
    }),
  })

  if (!resp.ok) {
    throw new Error(await resp.text())
  }

  const data = await resp.json()
  const text = data?.choices?.[0]?.message?.content ?? ""
  const usage = data?.usage ?? { prompt_tokens: 600, completion_tokens: 300 }
  const cny = priceOf("openrouter", internalModel, usage.prompt_tokens, usage.completion_tokens)

  return {
    text,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    cnyCost: cny,
    provider: "openrouter",
  }
}
