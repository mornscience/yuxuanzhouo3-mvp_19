"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.ok) setUsers(d.data) })
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">用户管理</h1>
        <p className="text-sm text-muted-foreground mt-1">查看和管理平台用户</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="搜索邮箱..." value={search}
          onChange={e => { setSearch(e.target.value); setLoading(true) }} />
      </div>

      <Card>
        <CardHeader><CardTitle>用户列表</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-4">邮箱</th>
                    <th className="text-left py-3 px-4">昵称</th>
                    <th className="text-left py-3 px-4">注册时间</th>
                    <th className="text-left py-3 px-4">余额</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">{u.nickname || "-"}</td>
                      <td className="py-3 px-4">{u.created_at ? new Date(u.created_at).toLocaleDateString("zh-CN") : "-"}</td>
                      <td className="py-3 px-4">{u.balance ?? 0}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">暂无数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
