import { streamAsyncCharacters } from "@/lib/http/stream"

export async function POST(req: Request) {
  const body = (await req.json()) as { projectName?: string }
  const projectName = body.projectName || "my-app"

  return streamAsyncCharacters(
    async () => {
      const lines: string[] = []
      const log = (s: string) => lines.push(s)

      log(`▶ Start deploying project: ${projectName}`)
      log(`• Building container image (simulated) ...`)
      await new Promise((r) => setTimeout(r, 300))
      log(`• Pushing image to registry (simulated) ...`)
      await new Promise((r) => setTimeout(r, 300))
      log(`• Creating cloud resources: domain, env vars, database stub ...`)
      await new Promise((r) => setTimeout(r, 300))
      const url = `https://${projectName}.demo-cloud.example.com`
      log(`\nSUCCESS: Deployed to ${url}`)
      return lines.join("\n")
    },
    { delayMs: 10, contentType: "text", keepAliveMs: 300 },
  )
}

