import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "mornbusiness — AI Business Operating System",
  description:
    "AI operating system for founders, CEOs, and investors. Build, scale, and fund your startup with AI-powered tools.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        {/* 动态修改 User-Agent 以绕过 Google WebView 限制 */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof navigator !== 'undefined' && navigator.userAgent.includes('WebView')) {
              // 保存原始 User-Agent
              window.originalUserAgent = navigator.userAgent;
              
              // 伪装成安卓 Chrome 浏览器
              const androidUserAgent = 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
              
              // 修改 navigator.userAgent
              Object.defineProperty(navigator, 'userAgent', {
                value: androidUserAgent,
                writable: false,
                configurable: true
              });
              
              // 同时修改其他相关属性
              Object.defineProperty(navigator, 'appVersion', {
                value: '5.0 (Linux; Android 13; SM-G991B)',
                writable: false,
                configurable: true
              });
              
              console.log('User-Agent modified to:', androidUserAgent);
            }
          `
        }} />
        
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
