// Next.js 启动时注入全局 fetch 重试 + TLS 兼容开关
//
// 说明：
// 1. 针对 Clash / 透明代理节点做 SNI 重写导致的 TLS 证书不匹配问题：
//    - 当 SUPABASE_ALLOW_INSECURE_TLS=1 时设置 NODE_TLS_REJECT_UNAUTHORIZED=0（Node.js 全局生效）
//    - 给全局 fetch 加上最多 3 次的指数退避重试（首次失败通常后续命中正确节点）
// 2. 登录等 Supabase 请求的核心容错在 lib/db-adapter.ts 的 getSupabase() 中实现（共享单例），
//    这里的全局包装是「额外保险」，给所有其他直接 fetch 的调用方同样的容错能力。
// 3. HTTPS_PROXY / HTTP_PROXY 的显式代理需要依赖 undici ProxyAgent；
//    由于 instrumentation 是 ESM 运行时不方便加载 undici，代理配置请在
//    项目启动时通过环境变量（例如 cross-env HTTPS_PROXY=...）传入即可。
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  try {
    const allowInsecureTls =
      process.env.SUPABASE_ALLOW_INSECURE_TLS === "1" ||
      process.env.SUPABASE_ALLOW_INSECURE_TLS === "true" ||
      process.env.SUPABASE_ALLOW_INSECURE_TLS === "yes"

    // ── 1. Node.js 全局 TLS 宽松开关（仅开发环境；对所有 https 请求生效） ──
    if (allowInsecureTls) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
      console.log("[instrumentation] NODE_TLS_REJECT_UNAUTHORIZED=0 (仅本地开发使用)")
    }

    // ── 2. 全局 fetch 包装重试机制（对 Supabase / 任何直接 fetch 的请求都生效） ──
    const maxAttempts = parseInt(process.env.SUPABASE_FETCH_RETRIES || "3", 10)
    const initialDelay = parseInt(process.env.SUPABASE_FETCH_RETRY_DELAY || "500", 10)

    const origFetch = (globalThis as any).fetch
    if (!origFetch || typeof origFetch !== "function") {
      console.warn("[instrumentation] globalThis.fetch not available, skip retry wrapper.")
      return
    }

    const retryableFetch = async function (input: any, init?: any, attempt = 1): Promise<any> {
      try {
        return await origFetch(input, init)
      } catch (err: any) {
        const msg = String(err?.message || err || "")
        const isTlsOrNetworkError =
          msg.includes("ERR_TLS_CERT_ALTNAME_INVALID") ||
          msg.includes("certificate") ||
          msg.includes("CERT") ||
          msg.includes("fetch failed") ||
          msg.includes("ECONNRESET") ||
          msg.includes("ETIMEDOUT") ||
          msg.includes("socket hang up") ||
          msg.includes("ENOTFOUND") ||
          msg.includes("ECONNREFUSED")
        if (isTlsOrNetworkError && attempt < maxAttempts) {
          const delay = initialDelay * Math.pow(2, attempt - 1)
          console.warn(
            `[instrumentation] fetch 第 ${attempt}/${maxAttempts} 次失败: ${msg.slice(0, 150)}。${delay}ms 后重试...`
          )
          await new Promise(r => setTimeout(r, delay))
          return retryableFetch(input, init, attempt + 1)
        }
        throw err
      }
    }

    // 覆盖 globalThis / global
    ;(globalThis as any).fetch = retryableFetch
    try { (global as any).fetch = retryableFetch } catch (_) { /* noop */ }

    console.log(`[instrumentation] Global fetch retry wrapper installed (retries=${maxAttempts})`)
  } catch (e: any) {
    console.error("[instrumentation] Failed to setup fetch wrapper:", e?.stack || e?.message || e)
  }
}
