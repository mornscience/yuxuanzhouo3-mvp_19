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

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
