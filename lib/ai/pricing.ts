// Simple pricing table (CNY). Adjust as needed.
export type Pricing = {
  [provider: string]: {
    [model: string]: { in: number; out: number } // cny per 1k tokens
  }
}

export const PRICING: Pricing = {
  aliyun: {
    "qwen2.5-lite": { in: 0.002, out: 0.006 },
    "qwen2.5-coder": { in: 0.005, out: 0.01 },
    "qwen-coder-turbo": { in: 0.004, out: 0.008 },
  },
  openai: {
    "gpt-4o-mini": { in: 0.01, out: 0.03 },
  },
  /** OpenRouter：按内部 model 别名计费（近似 USD 折算 CNY，仅用于预算估算） */
  openrouter: {
    "gpt-4o-mini": { in: 0.01, out: 0.03 },
    "gpt-4o": { in: 0.04, out: 0.12 },
    "qwen-coder-turbo": { in: 0.005, out: 0.01 },
    "qwen2.5-coder": { in: 0.005, out: 0.01 },
    "qwen2.5-lite": { in: 0.003, out: 0.008 },
  },
}

export function priceOf(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
) {
  const p = PRICING[provider]?.[model]
  if (!p) return 0
  return (p.in * (inputTokens / 1000)) + (p.out * (outputTokens / 1000))
}

export type Region = "cn" | "intl"

// Very simple route table: region -> providers preference（国外优先 OpenRouter 聚合）
// If AI_PROVIDER environment variable is set, force using that provider
export function providersFor(region: Region): string[] {
  // Check for region-specific forced provider from environment variables
  // Support AI_PROVIDER_CN and AI_PROVIDER_INTL for per-region control
  const regionSpecificKey = `AI_PROVIDER_${region.toUpperCase()}`
  const regionSpecificProvider = process.env[regionSpecificKey]

  if (regionSpecificProvider) {
    const validProviders = ["aliyun", "openai", "openrouter", "tencent"]
    if (validProviders.includes(regionSpecificProvider)) {
      console.log(`[AI-Pricing] Using region-specific provider from ${regionSpecificKey}: ${regionSpecificProvider}`)
      return [regionSpecificProvider]
    } else {
      console.log(`[AI-Pricing] Invalid ${regionSpecificKey} value: ${regionSpecificProvider}, falling back to default routing`)
    }
  }

  // Fallback to global DEFAULT_AI_PROVIDER or AI_PROVIDER if no region-specific setting
  const globalProvider = process.env.DEFAULT_AI_PROVIDER || process.env.AI_PROVIDER
  if (globalProvider) {
    const validProviders = ["aliyun", "openai", "openrouter", "tencent"]
    if (validProviders.includes(globalProvider)) {
      console.log(`[AI-Pricing] Using global provider from DEFAULT_AI_PROVIDER/AI_PROVIDER env: ${globalProvider}`)
      return [globalProvider]
    } else {
      console.log(`[AI-Pricing] Invalid provider value: ${globalProvider}, falling back to default routing`)
    }
  }

  // Default routing based on region
  if (region === "cn") {
    return ["aliyun", "openrouter", "openai"]
  }
  return ["openrouter", "openai", "aliyun"]
}

