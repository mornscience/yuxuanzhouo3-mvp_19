import { TextEncoder } from "node:util"

export type StreamOptions = {
  delayMs?: number
  contentType?: "text" | "sse"
}

/** Create a ReadableStream that emits text character-by-character (typing effect). */
export function streamCharacters(text: string, opts: StreamOptions = {}) {
  const delayMs = opts.delayMs ?? 8
  const encoder = new TextEncoder()
  const isSse = opts.contentType === "sse"

  let index = 0
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (index >= text.length) {
        if (isSse) {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        }
        controller.close()
        return
      }
      // emit a few chars per tick for smoother UX while keeping "逐字"感觉
      const chunk = text.slice(index, index + 3)
      index += 3
      const payload = isSse ? `data: ${chunk}\n\n` : chunk
      controller.enqueue(encoder.encode(payload))
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
    },
  })
}

export function streamResponse(text: string, opts: StreamOptions = {}) {
  const isSse = opts.contentType === "sse"
  const headers = new Headers()
  headers.set("Cache-Control", "no-cache")
  headers.set("Connection", "keep-alive")
  headers.set("Transfer-Encoding", "chunked")
  headers.set("Content-Type", isSse ? "text/event-stream; charset=utf-8" : "text/plain; charset=utf-8")
  const body = streamCharacters(text, opts)
  return new Response(body, { headers })
}

/** Open connection immediately, optionally emit keep-alive ticks, then type out the final text when ready. */
export function streamAsyncCharacters(getText: () => Promise<string>, opts: StreamOptions & { keepAliveMs?: number } = {}) {
  const isSse = opts.contentType === "sse"
  const headers = new Headers()
  headers.set("Cache-Control", "no-cache")
  headers.set("Connection", "keep-alive")
  headers.set("Transfer-Encoding", "chunked")
  headers.set("Content-Type", isSse ? "text/event-stream; charset=utf-8" : "text/plain; charset=utf-8")

  const encoder = new TextEncoder()
  const delayMs = opts.delayMs ?? 8
  const keepAliveMs = opts.keepAliveMs ?? 400

  let closed = false
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      // keep-alive ticker to make response visible immediately
      const ka = setInterval(() => {
        if (closed) return
        const tick = isSse ? "data: \n\n" : "\u200b" // zero-width space
        controller.enqueue(encoder.encode(tick))
      }, keepAliveMs)

      try {
        const text = await getText()
        // type out
        for (let i = 0; i < text.length; i += 3) {
          const chunk = text.slice(i, i + 3)
          const payload = isSse ? `data: ${chunk}\n\n` : chunk
          controller.enqueue(encoder.encode(payload))
          if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
        }
        if (isSse) controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        clearInterval(ka)
        closed = true
        controller.close()
      } catch (err) {
        clearInterval(ka)
        closed = true
        controller.error(err)
      }
    },
  })

  return new Response(body, { headers })
}
