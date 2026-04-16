import { getAdminSession } from "@/lib/admin/session"
import AdminSidebar from "./components/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const result = await getAdminSession()
  if (!result.valid || !result.session) return <>{children}</>
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar username={result.session.username} role={result.session.role} />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  )
}
