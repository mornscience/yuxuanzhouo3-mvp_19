import type { AIRequest, AIResponse } from "./types"
import { providersFor, priceOf } from "./pricing"
import { callAliyun } from "./providers/aliyun"
import { callOpenAI } from "./providers/openai"
import { callOpenRouter } from "./providers/openrouter"
import { meter } from "./meter"

type ProviderName = "aliyun" | "openai" | "openrouter"

async function callProvider(name: ProviderName, req: AIRequest): Promise<AIResponse> {
  if (name === "aliyun") return callAliyun(req)
  if (name === "openai") return callOpenAI(req)
  if (name === "openrouter") return callOpenRouter(req)
  throw new Error(`Unknown provider: ${name}`)
}

export async function callRoutedAI(
  req: AIRequest & { region: "cn" | "intl" },
): Promise<AIResponse> {
  // 优先级由 region 决定
  const order = providersFor(req.region) as ProviderName[]
  // 单次请求：避免同一轮里用两套 maxTokens 各扫一遍提供商，显著减少最坏情况延迟
  const variants: AIRequest[] = [req]

  console.log(`[AI-Router] Starting routing: region=${req.region}, order=${order.join(',')}, model=${req.model}, variants=${variants.length}`)
  for (const v of variants) {
    console.log(`[AI-Router] Trying variant: model=${v.model}, maxTokens=${v.maxTokens}`)
    for (const p of order) {
      // 预估成本（非常简化：按固定tokens估计）
      const expected = priceOf(p, v.model, 800, v.maxTokens ?? 300)
      console.log(`[AI-Router] Trying provider ${p}, expected cost=${expected}`)
      const ok = await meter.canSpend(v.projectId, v.userId, expected)
      if (!ok) {
        console.log(`[AI-Router] Budget check failed for provider ${p}`)
        continue
      }
      try {
        console.log(`[AI-Router] Calling provider ${p} with model ${v.model}`)
        const res = await callProvider(p, v)
        console.log(`[AI-Router] Provider ${p} succeeded: text length=${res.text.length}, cost=${res.cnyCost}`)
        await meter.commit(v.projectId, v.userId, res.cnyCost)
        return res
      } catch (err) {
        console.log(`[AI-Router] Provider ${p} failed:`, err instanceof Error ? err.message : String(err))
        // 尝试下一个
      }
    }
  }
  console.log(`[AI-Router] All providers failed for request: region=${req.region}, model=${req.model}, input length=${req.input.length}`)
  throw new Error("Budget exceeded or all providers failed")
}

