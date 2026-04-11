"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowLeft, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react"

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const isZh = (process.env.NEXT_PUBLIC_SITE_REGION ?? "auto").toLowerCase() === "cn"
  const router = useRouter()

  // 读取邀请码（从 URL ?ref= 参数）
  const [refCode] = useState(() => {
    if (typeof window === "undefined") return ""
    return new URLSearchParams(window.location.search).get("ref") || ""
  })

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              mornbusiness
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          {/* Glass Card */}
          <div className="relative">
            {/* Card background with glassmorphism */}
            <div 
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239,246,255,0.85) 50%, rgba(243,232,255,0.9) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(255,255,255,0.5) inset'
              }}
            />
            
            <div className="relative p-8 md:p-10">
              {/* Back button */}
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {isZh ? "返回首页" : "Back to home"}
              </Link>

              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                  {isZh ? "注册账号" : "Create an account"}
                </h1>
                <p className="text-slate-500 text-sm">
                  {isZh ? "输入你的邮箱和密码来创建一个新账号。" : "Enter your email and password to create a new account."}
                </p>
              </div>

              {/* Form */}
              <form
                className="space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const email = String(formData.get("email") ?? "")
                  const password = String(formData.get("password") ?? "")
                  const confirmPassword = String(formData.get("confirmPassword") ?? "")

                  if (!email || !password || !confirmPassword) {
                    toast({
                      title: isZh ? "缺少字段" : "Missing fields",
                      description: isZh ? "请填写所有必填项。" : "Please fill in all required fields.",
                      variant: "destructive",
                    })
                    return
                  }

                  if (password !== confirmPassword) {
                    toast({
                      title: isZh ? "密码不匹配" : "Passwords do not match",
                      description: isZh ? "两次输入的密码不一致。" : "The passwords you entered do not match.",
                      variant: "destructive",
                    })
                    return
                  }

                  if (password.length < 6) {
                    toast({
                      title: isZh ? "密码太短" : "Password too short",
                      description: isZh ? "密码长度至少为 6 位。" : "Password must be at least 6 characters.",
                      variant: "destructive",
                    })
                    return
                  }

                  try {
                    setLoading(true)
                    const res = await fetch("/api/auth/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, password, referralCode: refCode || undefined }),
                    })
                    const data = (await res.json()) as { message?: string; ok: boolean }

                    if (!res.ok || !data.ok) {
                      throw new Error(data.message ?? (isZh ? "注册失败。" : "Registration failed."))
                    }

                    toast({
                      title: isZh ? "注册成功" : "Success",
                      description: data.message ?? (isZh ? "账号已创建，请登录。" : "Account created successfully, please log in.")
                    })

                    // 注册成功后，跳转到登录页面
                    setTimeout(() => {
                      router.push("/login")
                    }, 1500)
                  } catch (error) {
                    toast({
                      title: isZh ? "请求失败" : "Request failed",
                      description: error instanceof Error ? error.message : isZh ? "未知错误。" : "Unexpected error.",
                      variant: "destructive",
                    })
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                    {isZh ? "邮箱" : "Email"}
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="you@company.com" 
                      required 
                      className="pl-12 h-12 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm
                        focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 
                        placeholder:text-slate-400 transition-all duration-300
                        hover:border-blue-300"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                    {isZh ? "密码" : "Password"}
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder={isZh ? "输入密码" : "Enter password"} 
                      required 
                      className="pl-12 pr-12 h-12 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm
                        focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 
                        placeholder:text-slate-400 transition-all duration-300
                        hover:border-blue-300"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 font-medium text-sm">
                    {isZh ? "确认密码" : "Confirm Password"}
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder={isZh ? "再次输入密码" : "Confirm password"} 
                      required 
                      className="pl-12 pr-12 h-12 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm
                        focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 
                        placeholder:text-slate-400 transition-all duration-300
                        hover:border-blue-300"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 
                    hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 
                    text-white font-semibold text-base
                    shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 
                    transition-all duration-300 hover:-translate-y-0.5
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isZh ? "注册中..." : "Registering..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      {isZh ? "立即注册" : "Register"}
                    </span>
                  )}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 pt-6 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-sm">
                  <Link 
                    href="/" 
                    className="text-slate-500 hover:text-blue-600 transition-colors relative group"
                  >
                    {isZh ? "返回首页" : "Back to home"}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300" />
                  </Link>
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>{isZh ? "已有账号？" : "Already have an account?"}</span>
                    <Link 
                      href="/login" 
                      className="text-blue-600 font-semibold hover:text-blue-700 transition-colors relative group"
                    >
                      {isZh ? "立即登录" : "Login now"}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
