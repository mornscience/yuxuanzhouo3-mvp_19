import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export type SubmissionType = "login" | "launch" | "connect-capital"

export type SubmissionRecord = {
  id: string
  type: SubmissionType
  createdAt: string
  data: Record<string, string>
}

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "submissions.json")

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    await readFile(DATA_FILE, "utf8")
  } catch {
    await writeFile(DATA_FILE, "[]", "utf8")
  }
}

export async function readSubmissions(): Promise<SubmissionRecord[]> {
  await ensureStore()
  const raw = await readFile(DATA_FILE, "utf8")
  try {
    const parsed = JSON.parse(raw) as SubmissionRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function appendSubmission(type: SubmissionType, data: Record<string, string>) {
  const records = await readSubmissions()
  const record: SubmissionRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    createdAt: new Date().toISOString(),
    data,
  }
  records.unshift(record)
  await writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf8")
  return record
}
