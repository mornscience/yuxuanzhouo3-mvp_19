'use client'

import React, { useEffect, useState } from "react"
import { LoginPrompt } from "@/components/market/login-prompt"

export default function OnlineIDEPage() {
  const [checkingLogin, setCheckingLogin] = useState(true)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [code, setCode] = useState<string>(`// JavaScript 运行示例\nfunction add(a, b) {\n  return a + b\n}\n\nconsole.log('add(2,3)=', add(2,3))`)
  const [output, setOutput] = useState<string>("")

  const runJs = () => {
    if (checkingLogin || isLoginPromptOpen) return
    const logs: string[] = []
    const originalLog = console.log
    try {
      ;(console as any).log = (...args: any[]) => {
        logs.push(args.map(String).join(" "))
      }
      // 安全起见，这只是浏览器端 demo，不接收外部代码写文件/网络
      // eslint-disable-next-line no-new-func
      const fn = new Function(code)
      fn()
      setOutput(logs.join("\n"))
    } catch (e) {
      setOutput(String(e))
    } finally {
      console.log = originalLog
    }
  }

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch("/api/me")
        const data = await res.json()
        if (cancelled) return
        if (!data?.ok) setIsLoginPromptOpen(true)
      } catch {
        if (!cancelled) setIsLoginPromptOpen(true)
      } finally {
        if (!cancelled) setCheckingLogin(false)
      }
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="container mx-auto max-w-5xl py-8 space-y-6">
      <h1 className="text-2xl font-semibold">在线可运行 IDE（浏览器端 Demo）</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-3">
          <div className="text-sm text-slate-600 mb-2">代码（JavaScript）</div>
          <textarea
            className="w-full h-[360px] font-mono text-sm rounded-md border p-3"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              className="px-3 py-1.5 rounded-md bg-emerald-600 text-white disabled:opacity-60"
              onClick={runJs}
              disabled={checkingLogin}
            >
              运行
            </button>
            <button
              className="px-3 py-1.5 rounded-md border disabled:opacity-60"
              onClick={() => setCode("// 新文件\nconsole.log('hello')")}
              disabled={checkingLogin}
            >
              新建
            </button>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-sm text-slate-600 mb-2">输出</div>
          <pre className="w-full h-[360px] rounded-md bg-slate-950/90 text-slate-100 p-3 text-xs overflow-auto whitespace-pre-wrap">
            {output || " "}
          </pre>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        说明：这是一个轻量级前端演示，适合 JS/TS 片段快速运行。服务端 Runner（Java/Python/Go 等）可按需接入后端沙箱执行。
      </p>

      <LoginPrompt
        isOpen={isLoginPromptOpen}
        onClose={() => {
          setIsLoginPromptOpen(false)
        }}
      />
    </main>
  )
}

