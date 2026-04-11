import { useCallback, useRef, useState } from "react"

export type StreamMode = "text" | "sse"

export type StreamOptions = {
  onChunk?: (chunk: string) => void
}

export function useStreamText() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buffer, setBuffer] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(
    async (url: string, payload: unknown, mode: StreamMode = "text", options: StreamOptions = {}) => {
      setIsStreaming(true)
      setError(null)
      setBuffer("")
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac

      try {
        if (mode === "sse") {
          // SSE：参数通过 query 指定 stream=sse；payload 建议服务端按 POST 支持
          const finalUrl = url.includes("?") ? `${url}&stream=sse` : `${url}?stream=sse`
          const es = new EventSource(finalUrl)
          es.onmessage = (e) => {
            if (e.data === "[DONE]") {
              es.close()
              setIsStreaming(false)
              return
            }
            setBuffer((prev) => prev + e.data)
          }
          es.onerror = () => {
            es.close()
            setIsStreaming(false)
            setError("SSE connection error")
          }
          // 无法由 AbortController 直接中止 SSE；组件卸载时关闭即可
          return
        }

        const finalUrl = url.includes("?") ? `${url}&stream=1` : `${url}?stream=1`
        const res = await fetch(finalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-stream": "1" },
          body: JSON.stringify(payload ?? {}),
          signal: ac.signal,
        })
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) throw new Error("No readable stream")
        // 节流：聚合片段，每 ~16ms 刷新一次，避免过深更新栈
        let pending = ""
        let lastFlush = Date.now()
        async function flush() {
          if (pending.length === 0) return
          const chunk = pending
          pending = ""
          if (options.onChunk) {
            options.onChunk(chunk)
          } else {
            setBuffer((prev) => prev + chunk)
          }
        }
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          pending += decoder.decode(value, { stream: true })
          const now = Date.now()
          if (now - lastFlush >= 16) {
            await flush()
            lastFlush = now
          }
        }
        await flush()
        setIsStreaming(false)
      } catch (err) {
        if ((err as any)?.name === "AbortError") return
        setError(err instanceof Error ? err.message : String(err))
        setIsStreaming(false)
      }
    },
    [],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  return { isStreaming, error, buffer, start, stop }
}

