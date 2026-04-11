import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const removeDirs = ["pages", join("src", "pages")]
const scanRoots = ["app", "pages", "src"]
const ignoredDirs = new Set(["node_modules", ".next", ".git"])
const suspiciousFiles = []

for (const relPath of removeDirs) {
  const absPath = join(projectRoot, relPath)
  if (existsSync(absPath)) {
    rmSync(absPath, { recursive: true, force: true })
    console.log(`[prebuild-cleanup] Removed unexpected directory: ${relPath}`)
  }
}

function walk(dir) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const absPath = join(dir, entry)
    const stats = statSync(absPath)
    if (stats.isDirectory()) {
      if (ignoredDirs.has(entry)) continue
      walk(absPath)
      continue
    }

    if (!/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(entry)) continue

    const content = readFileSync(absPath, "utf8")
    if (!content.includes("next/document")) continue

    const normalized = absPath.replace(/\\/g, "/")
    suspiciousFiles.push(normalized)

    const isValidDocument = /\/pages\/_document\.(js|jsx|ts|tsx)$/.test(normalized)
    if (!isValidDocument) {
      rmSync(absPath, { force: true })
      console.log(`[prebuild-cleanup] Removed invalid next/document usage file: ${normalized}`)
    }
  }
}

for (const root of scanRoots) {
  const absRoot = join(projectRoot, root)
  if (existsSync(absRoot)) {
    walk(absRoot)
  }
}

if (suspiciousFiles.length > 0) {
  console.log("[prebuild-cleanup] Found files referencing next/document:")
  for (const file of suspiciousFiles) {
    console.log(`  - ${file}`)
  }
}
