import fs from "node:fs"
import path from "node:path"

export type MemoryItem = {
  id: string
  projectId: string
  userId: string
  type: "decision" | "constraint" | "todo" | "note"
  content: string
  createdAt: number
}

const DATA_DIR = path.join(process.cwd(), ".data")
const DATA_FILE = path.join(DATA_DIR, "ai_memory.json")

let inMemory: MemoryItem[] | null = null

function ensureLoaded() {
  if (inMemory) return
  try {
    const buf = fs.readFileSync(DATA_FILE, "utf-8")
    inMemory = JSON.parse(buf) as MemoryItem[]
  } catch {
    inMemory = []
  }
}

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemory, null, 2), "utf-8")
  } catch {
    // read-only env (e.g., serverless). Best-effort: keep memory in RAM only.
  }
}

export function addMemory(item: Omit<MemoryItem, "id" | "createdAt">): MemoryItem {
  ensureLoaded()
  const full: MemoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: Date.now(),
  }
  inMemory!.push(full)
  // cap to last 2000 to avoid unbounded growth
  if (inMemory!.length > 2000) inMemory = inMemory!.slice(-2000)
  persist()
  return full
}

export function listMemory(projectId: string, limit = 50): MemoryItem[] {
  ensureLoaded()
  const all = inMemory!.filter((m) => m.projectId === projectId)
  return all.sort((a, b) => a.createdAt - b.createdAt).slice(-limit)
}

export function recentContextText(projectId: string, limit = 20): string {
  const items = listMemory(projectId, limit)
  if (items.length === 0) return ""
  const lines = items.map(
    (m) =>
      `[${new Date(m.createdAt).toISOString()}][${m.type}] ${m.userId}: ${m.content}`,
  )
  return `Project context (recent ${items.length}):\n${lines.join("\n")}\n---\n`
}

