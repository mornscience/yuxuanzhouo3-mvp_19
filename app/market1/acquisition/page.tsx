import { requireSession } from "../require-session"
import { AcquisitionClient } from "./acquisition-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function AcquisitionPage() {
  await requireSession()
  return (
    <div>
      <AcquisitionClient />
    </div>
  )
}
