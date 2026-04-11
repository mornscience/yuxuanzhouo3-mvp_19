export type AIRequest = {
  model: string
  input: string
  /** Overrides default “coding assistant” system message when set */
  system?: string
  maxTokens?: number
  temperature?: number
  userId: string
  projectId: string
  region?: "cn" | "intl"
}

export type AIResponse = {
  text: string
  inputTokens: number
  outputTokens: number
  cnyCost: number
  provider: string
}

