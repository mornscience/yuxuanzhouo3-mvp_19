import { NextRequest } from "next/server"
import { streamAsyncCharacters } from "@/lib/http/stream"
import { getUserIdFromRequest } from "@/lib/market/marketing-route"
import { insertScaffoldProject } from "@/lib/market/acquisition"

type Template = "react-admin" | "spring-boot-blog"

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { template: Template; projectName: string }
  const { template, projectName } = body
  const userId = getUserIdFromRequest(req)

  return streamAsyncCharacters(
    async () => {
      const lines: string[] = []
      const log = (s: string) => lines.push(s)

      log(`▶ Start scaffolding: ${projectName}`)
      log(`• Template: ${template}`)
      log(`• Creating directory structure ...`)

      // Simulated processing
      await new Promise((r) => setTimeout(r, 400))
      
      const zipUrl = `http://localhost:3001/download/${projectName}.zip`
      
      log(`• Writing base CRUD/example code ...`)
      log(`• Generating ZIP archive ...`)
      log(`• Recording to database ...`)
      
      // Record to database
      if (userId) {
        await insertScaffoldProject(userId, {
          projectName,
          template,
          zipUrl,
          status: "completed"
        })
      }

      log(`• Done.`)
      log(`\nSUCCESS: Scaffolding completed for ${projectName}.`)
      log(`You can download your project here: ${zipUrl}`)

      return lines.join("\n")
    },
    { delayMs: 10, contentType: "text", keepAliveMs: 300 },
  )
}

