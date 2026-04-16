"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/payments", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.ok) setPayments(d.data) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">支付记录</h1>
        <p className="text-sm text-muted-foreground mt-1">查看平台支付订单</p>
      </div>
      <Card>
        <CardHeader><CardTitle>订单列表</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-4">订单ID</th>
                    <th className="text-left py-3 px-4">用户</th>
                    <th className="text-left py-3 px-4">金额</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{p.id?.slice(0, 8)}...</td>
                      <td className="py-3 px-4">{p.user_id?.slice(0, 8)}...</td>
                      <td className="py-3 px-4">${p.amount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${p.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{p.created_at ? new Date(p.created_at).toLocaleDateString("zh-CN") : "-"}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">暂无数据</td></tr>
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
