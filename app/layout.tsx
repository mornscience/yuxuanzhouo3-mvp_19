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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 检测是否在 WebView 内
                var userAgent = navigator.userAgent.toLowerCase();
                var isAndroidWebView = userAgent.includes('android') && userAgent.includes('wv');
                var isiOSWebView = (userAgent.includes('iphone') || userAgent.includes('ipad')) && userAgent.includes('webkit') && !userAgent.includes('safari');
                
                // 如果在 WebView 内，修改 User-Agent
                if (isAndroidWebView || isiOSWebView) {
                  // 伪装成正常的安卓 Chrome 浏览器
                  var fakeUserAgent = 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
                  
                  // 修改 navigator.userAgent
                  Object.defineProperty(navigator, 'userAgent', {
                    get: function() { return fakeUserAgent; },
                    configurable: true
                  });
                  
                  // 修改 appVersion
                  Object.defineProperty(navigator, 'appVersion', {
                    get: function() { return fakeUserAgent; },
                    configurable: true
                  });
                  
                  // 修改 platform
                  Object.defineProperty(navigator, 'platform', {
                    get: function() { return 'Linux armv8l'; },
                    configurable: true
                  });
                  
                  console.log('[WebView] User-Agent伪装为:', fakeUserAgent);
                }
              })();
            `
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
