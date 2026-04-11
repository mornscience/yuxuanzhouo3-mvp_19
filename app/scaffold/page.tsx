'use client'

import React, { useMemo, useRef, useState, useEffect } from "react"
import { LoginPrompt } from "@/components/market/login-prompt"

type Template = "react-admin" | "vue-project" | "next-project" | "springboot-api"

const DEFAULT_BASE = process.env.NEXT_PUBLIC_SCAFFOLD_BASE || "http://localhost:3001"

export default function ScaffoldPage() {
  const [projectName, setProjectName] = useState("my-app")
  const [template, setTemplate] = useState<Template>("react-admin")
  const [logs, setLogs] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // 检查登录状态
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

  const append = (line: string) => setLogs((prev) => (prev ? prev + "\n" + line : line))

  const templates = useMemo(
    () => [
      { value: "react-admin", label: "React Admin" },
      { value: "vue-project", label: "Vue Project" },
      { value: "next-project", label: "Next.js Project" },
      { value: "springboot-api", label: "SpringBoot API" },
    ],
    [],
  )

  function startSpinner(prefix = "等待服务器响应") {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    let i = 0
    timerRef.current = setInterval(() => {
      const f = frames[i % frames.length]
      i += 1
      const lines = logs.split("\n")
      // 更新最后一行
      const updated = [...lines.slice(0, -1), `${prefix} ${f}`].filter(Boolean).join("\n")
      setLogs(updated)
    }, 120)
  }

  function stopSpinner() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true)
      return
    }
    if (!projectName.trim()) {
      alert("请输入项目名称")
      return
    }
    setLoading(true)
    setLogs("")
    append(`▶ 一键生成脚手架`)
    append(`• 服务器: ${baseUrl}`)
    append(`• 项目名称: ${projectName}`)
    append(`• 模板类型: ${template}`)
    append(``)
    append(`请求已发送，等待服务器生成中 ...`)
    startSpinner("等待服务器响应")

    try {
      const resp = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, templateType: template }),
      })

      stopSpinner()

      if (!resp.ok) {
        const text = await resp.text()
        append(`✖ 请求失败：${resp.status} ${resp.statusText}`)
        append(text)
        setLoading(false)
        return
      }
      const data = (await resp.json()) as { success?: boolean; downloadUrl?: string; message?: string }
      if (!data?.success || !data?.downloadUrl) {
        append(`✖ 生成失败：${data?.message || "未返回 downloadUrl"}`)
        setLoading(false)
        return
      }

      append(`✔ 生成成功`)
      append(`下载链接：${data.downloadUrl}`)
      append(`正在开始下载...`)

      // 触发下载
      const a = document.createElement("a")
      a.href = data.downloadUrl
      a.download = ""
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      append(`若未自动下载，请复制到浏览器打开上方链接。`)
    } catch (err) {
      stopSpinner()
      append(`✖ 网络或跨域错误：${err instanceof Error ? err.message : String(err)}`)
      append(`若为 CORS 问题，请在 E:\\scaffold-server 开启跨域(Access-Control-Allow-Origin)。`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto max-w-3xl py-8 space-y-6">
      <h1 className="text-2xl font-semibold">一键生成项目脚手架</h1>

      <div className="rounded-lg border bg-white p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600">项目名称</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="my-app"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">模板类型</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as Template)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              {templates.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-600">脚手架服务地址</label>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="http://localhost:3001"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            className="px-3 py-1.5 rounded-md bg-emerald-600 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "生成中…" : "一键生成"}
          </button>
        </div>

        <div>
          <div className="text-sm text-slate-600 mb-1">实时日志</div>
          <pre className="min-h-[240px] whitespace-pre-wrap rounded-md bg-black text-green-200 p-3 text-xs">
            {logs || " "}
          </pre>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground mt-8">
        <p>© 2026 mornbusiness 版权所有</p>
      </div>

      <LoginPrompt isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
    </main>
  )
}

