'use client'

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginPrompt } from "@/components/market/login-prompt"

export default function ProjectStudioPage() {
  const router = useRouter()
  const [projectName, setProjectName] = useState("my-spring-api")
  const [logs, setLogs] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const append = (s: string) => setLogs((p) => (p ? p + "\n" + s : s))

  function startSpinner(prefix = "等待服务器响应") {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    let i = 0
    timerRef.current = setInterval(() => {
      const f = frames[i % frames.length]
      i += 1
      const lines = logs.split("\n")
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

  async function generate() {
    if (!projectName.trim()) {
      alert("请输入项目名称")
      return
    }

    // 未登录时：弹窗提示前往登录；取消则保持在当前页面
    try {
      const meResp = await fetch("/api/me", { credentials: "same-origin" })
      const me = await meResp.json()
      if (!me?.ok) {
        setIsLoginPromptOpen(true)
        return
      }
    } catch {
      setIsLoginPromptOpen(true)
      return
    }

    setLoading(true)
    setLogs("")
    append("▶ 一键生成 SpringBoot 后端接口脚手架")
    append("• 服务器: http://localhost:3001")
    append(`• 项目名称: ${projectName}`)
    append("• 模板类型: springboot-api")
    append("")
    append("请求已发送，等待服务器生成中 ...")
    startSpinner("等待服务器响应")

    try {
      const resp = await fetch("/api/spring-genera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName }),
      })
      stopSpinner()
      if (!resp.ok) {
        append(`✖ 请求失败：${resp.status} ${resp.statusText}`)
        append(await resp.text())
        setLoading(false)
        return
      }
      const data = (await resp.json()) as { success?: boolean; downloadUrl?: string; message?: string }
      if (!data?.success || !data?.downloadUrl) {
        append(`✖ 生成失败：${data?.message || "未返回 downloadUrl"}`)
        setLoading(false)
        return
      }
      append("✔ 生成成功")
      append(`下载链接：${data.downloadUrl}`)
      append("正在开始下载...")
      const a = document.createElement("a")
      a.href = data.downloadUrl
      a.download = ""
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      append("若未自动下载，请复制到浏览器打开上方链接。")
    } catch (err) {
      stopSpinner()
      append(`✖ 网络或跨域错误：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto max-w-3xl py-8 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => router.back()}
          className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm"
        >
          ← 返回上一级
        </button>
        <h1 className="text-2xl font-semibold">SpringBoot 后端接口 · 一键脚手架</h1>
      </div>

      <div className="rounded-lg border p-4 space-y-3 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600">项目名称</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="my-spring-api"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">模板类型</label>
            <select disabled className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-100 text-gray-700">
              <option value="springboot-api">SpringBoot 后端接口</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={generate}
            className="px-3 py-1.5 rounded-md bg-emerald-600 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "生成中…" : "一键生成"}
          </button>
        </div>

        <div className="mt-2">
          <div className="text-sm text-slate-600 mb-1">生成日志</div>
          <pre className="min-h-[200px] whitespace-pre-wrap rounded-md bg-black text-green-200 p-3 text-xs">
            {logs || " "}
          </pre>
        </div>
      </div>

      <LoginPrompt
        isOpen={isLoginPromptOpen}
        onClose={() => {
          setIsLoginPromptOpen(false)
        }}
      />
    </main>
  )
}

