import path from "node:path"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
}

export default nextConfig
