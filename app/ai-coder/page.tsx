"use client"

import { useState, useRef, useEffect } from "react"
import { useStreamText } from "@/hooks/useStreamText"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoginPrompt } from "@/components/market/login-prompt"
import {
  Send, Code, RefreshCw, MessageSquare, Sparkles,
  ChevronRight, Globe, Zap,
  Cpu, FileCode, Terminal, Type
} from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  mode: "complete" | "refactor" | "explain" | "chat"
  language: string
  timestamp: Date
}

type Mode = "complete" | "refactor" | "explain" | "chat"

/** 若整段回复仅被一层 markdown 代码围栏包裹，去掉围栏便于阅读 */
function stripSingleOuterFence(s: string): string {
  const t = s.trim()
  const m = /^```[a-zA-Z0-9+#.-]*\s*\r?\n([\s\S]*?)\r?\n```$/.exec(t)
  return m ? m[1].trim() : s
}

export default function AICoderPage() {
  const [mode, setMode] = useState<Mode>("chat")
  const [language, setLanguage] = useState("TypeScript")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 你好！我是 **AI 程序员助手**，专门帮你处理编程任务。\n\n**我能做什么？**\n• 📝 **代码补全** - 根据需求编写完整代码\n• 🔧 **代码重构** - 优化和改进现有代码\n• 📚 **代码解释** - 详细解释代码逻辑和原理\n• 💬 **编程对话** - 回答任何编程相关问题\n\n**如何使用？**\n1. 选择下方的功能模式\n2. 输入你的需求或代码\n3. 按 **Enter** 发送（Shift+Enter换行）\n\n💡 **语言提示**：你可以要求我用特定语言回答，例如'用中文回答'或'answer in English'。",
      mode: "chat",
      language: "TypeScript",
      timestamp: new Date(),
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const streamingMsgIdRef = useRef<string | null>(null)
  const { start, isStreaming, error, stop } = useStreamText()

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/market/admin/acquisition")
        const json = await response.json()
        setIsLoggedIn(!!json.data.profile)
      } catch (err) {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return
    // 中文等 IME 组字期间不要拦截 Enter，否则会无法选词；组字结束后再按 Enter 发送
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    e.currentTarget.form?.requestSubmit()
  }

  async function handleSend() {
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true)
      return
    }
    console.log(`[AI-Coder] handleSend called, input: "${input}", trimmed: "${input.trim()}", loading: ${loading}`)
    if (!input.trim() || loading) return

    const userInput = input.trim()
    setInput("")

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      mode,
      language,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    // 准备请求数据
    let requestBody: any = {}
    if (mode === "chat" || mode === "complete") {
      requestBody = { mode, prompt: userInput, code: "", language }
    } else {
      requestBody = { mode, code: userInput, prompt: "", language }
    }

    // 先插入一个空的 AI 消息，后续用流式内容实时填充
    const streamingId = (Date.now() + 1).toString()
    streamingMsgIdRef.current = streamingId
    setMessages(prev => [
      ...prev,
      {
        id: streamingId,
        role: "assistant",
        content: "",
        mode,
        language,
        timestamp: new Date(),
      },
    ])

    // 开始流式请求（逐字追加）：直接把片段写入当前 AI 消息，避免中间 buffer 再映射导致的深度问题
    await start("/api/ai-coder", requestBody, "text", {
      onChunk: (chunk) => {
        const id = streamingMsgIdRef.current
        if (!id) return
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, content: (m.content || "") + chunk } : m)),
        )
      },
    })

    // 结束
    setLoading(false)
    streamingMsgIdRef.current = null
  }

  // 无需额外 buffer -> messages 的桥接；已经在 onChunk 中直接写入

  /** 与「代码解释」一致的绿色系：模式按钮激活态 + AI 回复卡片 */
  const modeConfig = {
    complete: {
      label: "代码补全",
      icon: Code,
      color: "bg-green-100 text-green-800 border-green-300",
      desc: "根据需求编写完整代码"
    },
    refactor: {
      label: "代码重构",
      icon: RefreshCw,
      color: "bg-green-100 text-green-800 border-green-300",
      desc: "优化和改进现有代码"
    },
    explain: {
      label: "代码解释",
      icon: MessageSquare,
      color: "bg-green-100 text-green-800 border-green-300",
      desc: "详细解释代码逻辑"
    },
    chat: {
      label: "编程对话",
      icon: Sparkles,
      color: "bg-green-100 text-green-800 border-green-300",
      desc: "回答编程相关问题"
    },
  }

  const languageOptions = [
    { value: "TypeScript", icon: Type, label: "TypeScript" },
    { value: "JavaScript", icon: FileCode, label: "JavaScript" },
    { value: "Python", icon: Terminal, label: "Python" },
    { value: "Go", icon: Cpu, label: "Go" },
  ]

  const ModeIcon = modeConfig[mode].icon

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-slate-900">
      {/* Header */}
      <section className="container mx-auto max-w-6xl px-4 pt-8 pb-4">
        <div className="text-center space-y-3">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-4 py-1.5">
            <Zap className="w-3 h-3 mr-1.5" />
            AI 程序员 · {modeConfig[mode].label}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            与 <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI 程序员</span> 对话
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            像与同事交流一样，通过自然对话完成编程任务。支持代码补全、重构、解释和编程问答。
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4">
        {/* 控制面板 */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700 mb-1.5">选择功能模式</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(modeConfig) as [Mode, typeof modeConfig.complete][]).map(([key, config]) => {
                  const Icon = config.icon
                  const isActive = mode === key
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setMode(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${isActive ? config.color + ' shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{config.label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="min-w-[180px]">
              <p className="text-sm font-medium text-slate-700 mb-1.5">编程语言</p>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="font-medium">{modeConfig[mode].label}</span>
              <span className="text-slate-400">•</span>
              <span>{modeConfig[mode].desc}</span>
            </div>
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          {/* 消息列表 */}
          <div className="h-[calc(100vh-420px)] min-h-[400px] max-h-[600px] overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-6 ${message.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[85%]"}`}
              >
                {message.role === "user" ? (
                  // 用户消息 - 右对齐，简洁样式
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-none px-4 py-3 shadow-sm">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {message.content}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-green-600" />
                      <span className="font-medium">AI 程序员</span>
                      <span className="text-slate-400">•</span>
                      <span>{modeConfig[message.mode].label}</span>
                      <span className="text-slate-400">•</span>
                      <span>{message.language}</span>
                    </div>
                    <div
                      className={`${modeConfig[message.mode].color} rounded-lg p-4 border shadow-sm`}
                    >
                      <pre
                        className={`whitespace-pre-wrap text-sm leading-relaxed ${
                          message.mode === "complete" || message.mode === "refactor"
                            ? "font-mono"
                            : "font-sans"
                        }`}
                      >
                        {message.id === (streamingMsgIdRef.current ?? "") && isStreaming && !message.content
                          ? "…" // 初始几毫秒显示“思考”占位
                          : message.mode === "complete" || message.mode === "refactor"
                          ? stripSingleOuterFence(message.content)
                          : message.content}
                      </pre>
                    </div>
                    {message.mode === "refactor" && (
                      <div className="text-xs text-green-800 bg-green-50 border border-green-200 px-2 py-1.5 rounded-md inline-flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        已输出重构结果（含注释说明）
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && !isStreaming && (
              <div className="mb-6 max-w-[85%]">
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-green-600" />
                    <span className="font-medium">AI 程序员 正在思考...</span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="border-t border-gray-200 p-4">
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault()
                void handleSend()
              }}
            >
              <textarea
                ref={inputRef}
                name="message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`输入你的${mode === "chat" ? "编程问题" : "代码或需求"}... (按 Enter 发送，Shift+Enter 换行)`}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-3 bottom-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-slate-500">
                当前模式: <span className="font-medium">{modeConfig[mode].label}</span> •
                语言: <span className="font-medium">{language}</span>
              </div>
              <div className="text-xs text-slate-500">
                💡 提示: 输入代码时，AI会自动识别语言和上下文
              </div>
            </div>
          </div>
        </div>

        {/* 快捷示例 */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-700 mb-3">💡 试试这些例子：</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setMode("complete")
                setInput("实现一个React计数器组件，包含增加、减少和重置功能")
              }}
              className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <Code className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-800">React计数器组件</span>
              </div>
              <p className="text-xs text-slate-600">使用React和TypeScript实现</p>
            </button>
            <button
              onClick={() => {
                setMode("refactor")
                setInput(`function processData(items) {
  let result = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].active) {
      result.push({
        id: items[i].id,
        name: items[i].name.toUpperCase(),
        value: items[i].value * 2
      });
    }
  }
  return result;
}`)
              }}
              className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-slate-800">重构数据处理函数</span>
              </div>
              <p className="text-xs text-slate-600">使用现代JavaScript特性优化</p>
            </button>
          </div>
        </div>

        {/* 导航按钮 */}
        <div className="flex items-center justify-center gap-3 pb-8">
          <Button variant="outline" asChild>
            <Link href="/">
              <Globe className="w-4 h-4 mr-2" />
              返回首页
            </Link>
          </Button>
        </div>
      </div>
      <LoginPrompt isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
    </main>
  )
}