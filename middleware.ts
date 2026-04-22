import { NextRequest, NextResponse } from "next/server"
import { deserializeSession } from "@/lib/admin/session"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 保护 /admin 路由（登录页除外）
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const cookie = request.cookies.get("admin_session")
    if (!cookie) return NextResponse.redirect(new URL("/admin/login", request.url))

    const session = deserializeSession(cookie.value)
    if (!session || session.expiresAt < Math.floor(Date.now() / 1000)) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // 为所有请求添加 CSP 头部，允许 PayPal 沙盒运行
  const response = NextResponse.next()
  
  // 添加 CSP 头部，允许 PayPal 沙盒域名和必要的脚本
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com",
      "style-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com",
      "img-src 'self' data: https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com",
      "connect-src 'self' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com https://c.paypal.com",
      "frame-src https://*.paypal.com https://*.paypal.cn",
      "font-src 'self' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn",
    ].join("; ")
  )
  
  // 添加 CORS 头部
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/market/membership/:path*"],
}
