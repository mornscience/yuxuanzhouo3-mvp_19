import type { AIRequest, AIResponse } from "../types"
import { priceOf } from "../pricing"

export async function callOpenAI(req: AIRequest): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured")

  const defaultSystem =
    "You are a helpful coding assistant. Respond in the language preferred by the user. If the user asks for a specific language (e.g., '用中文回答', 'answer in English', '中文回复', '英文回答'), use that language. If no language preference is specified, use the same language as the user's question."
  const messages = [
    { role: "system", content: req.system ?? defaultSystem },
    { role: "user", content: req.input },
  ]

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: req.model || "gpt-4o-mini",
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
  const cny = priceOf("openai", req.model || "gpt-4o-mini", usage.prompt_tokens, usage.completion_tokens)
  return {
    text,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    cnyCost: cny,
    provider: "openai",
  }
}

