"use client"
import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Market1LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/market1/auth/session", { cache: "no-store" }).then(r => {
      if (r.ok) router.replace("/market1")
    })
  }, [router])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/market1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) throw new Error(data?.error || "登录失败")
      router.replace("/market1")
    } catch (err: any) {
      setError(err?.message || "登录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">营销系统后台</h1>
          <p className="mt-1 text-sm text-gray-500">登录后可进入用户分析、获客、通知、裂变四个子系统</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">用户名</label>
          <input className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">密码</label>
          <input type="password" className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full h-10 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors">
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  )
}
