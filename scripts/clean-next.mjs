import { existsSync, rmSync } from "node:fs"
import { join } from "node:path"

const dir = join(process.cwd(), ".next")
if (existsSync(dir)) {
  rmSync(dir, { recursive: true, force: true })
  console.log("[clean-next] Removed .next — restart dev and hard-refresh the browser (Ctrl+Shift+R).")
} else {
  console.log("[clean-next] No .next directory to remove.")
}
