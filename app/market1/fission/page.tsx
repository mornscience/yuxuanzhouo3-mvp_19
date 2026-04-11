import { requireSession } from "../require-session"
import { FissionClient } from "./fission-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function FissionPage() {
  await requireSession()
  return <FissionClient />
}
