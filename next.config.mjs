import path from "node:path"

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb'
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  // 这些包只在服务端使用
  serverExternalPackages: ['@cloudbase/node-sdk'],
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd()),
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, path: false, stream: false, crypto: false,
        os: false, net: false, tls: false, child_process: false,
        'fs/promises': false,
      }
    }
    return config
  },
  // 添加 CSP 配置
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com",
            "style-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com",
            "img-src 'self' data: https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com",
            "connect-src 'self' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn https://www.gstatic.com https://*.synchronycredit.com https://synchronycredit.com https://www.datadoghq-browser-agent.com https://c.paypal.com",
            "frame-src https://*.paypal.com https://*.paypal.cn",
            "font-src 'self' https://*.paypal.com https://*.paypal.cn https://*.paypalobjects.com https://objects.paypal.cn",
          ].join('; '),
        },
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization',
        },
      ],
    },
  ],
}

export default nextConfig
