import { callAliyun } from "./providers/aliyun"
import { callOpenRouter } from "./providers/openrouter"

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface AIProvider {
  chat: (messages: ChatMessage[]) => Promise<string>
}

export function getAIProvider(projectId: string = "default"): AIProvider {
  const provider = process.env.AI_PROVIDER || "aliyun"
  
  return {
    async chat(messages: ChatMessage[]): Promise<string> {
      const input = messages.map(m => `${m.role}: ${m.content}`).join("\n")
      
      if (provider === "openrouter") {
        const result = await callOpenRouter({
          model: process.env.DEFAULT_MODEL_INTL || "gpt-4o-mini",
          input,
          system: messages.find(m => m.role === "system")?.content,
          userId: "market-user",
          projectId,
          region: "intl"
        })
        return result.text
      } else {
        // 默认使用阿里云
        // 根据项目类型选择不同模型
        let model: string
        if (projectId === "market-email") {
          // 邮件生成使用专门的邮件模型
          model = process.env.ALIYUN_EMAIL_MODEL || "qwen-turbo"
        } else {
          // 其他场景使用默认模型（代码专用）
          model = process.env.ALIYUN_DEFAULT_MODEL || "qwen-coder-turbo"
        }
        
        const result = await callAliyun({
          model,
          input,
          system: messages.find(m => m.role === "system")?.content,
          userId: "market-user",
          projectId,
          region: "cn"
        })
        return result.text
      }
    }
  }
}
