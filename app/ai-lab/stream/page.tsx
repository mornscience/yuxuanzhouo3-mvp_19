"use client"

import React, { useState } from "react"
import { useStreamText } from "@/hooks/useStreamText"
import StreamViewer from "@/components/StreamViewer"

export default function StreamDemoPage() {
  const [prompt, setPrompt] = useState("用中文写一个 add(a:number,b:number):number，并附带JSDoc")
  const [mode, setMode] = useState<"complete" | "explain" | "refactor">("complete")
  const { buffer, start, stop, isStreaming, error } = useStreamText()

  const run = async () => {
    await start("/api/ai-coder", { mode, prompt, language: "TypeScript" }, "text")
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 space-y-6">
      <h1 className="text-2xl font-semibold">AI 流式输出演示</h1>
      <div className="space-y-3">
        <textarea
          className="w-full h-28 rounded-md border p-3 text-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入需求..."
        />
        <div className="flex items-center gap-2">
          <select
            className="border rounded-md px-2 py-1"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="complete">代码补全</option>
            <option value="explain">代码解释</option>
            <option value="refactor">代码重构</option>
          </select>
          <button
            className="px-3 py-1.5 rounded-md bg-emerald-600 text-white disabled:opacity-60"
            onClick={run}
            disabled={isStreaming}
          >
            {isStreaming ? "生成中…" : "开始生成（流式）"}
          </button>
          <button className="px-3 py-1.5 rounded-md border" onClick={stop}>
            停止
          </button>
        </div>
      </div>

      <StreamViewer title="输出" text={buffer} />
      {error ? <div className="text-red-600 text-sm">错误：{error}</div> : null}
    </div>
  )
}

