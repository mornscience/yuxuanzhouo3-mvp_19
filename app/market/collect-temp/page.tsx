﻿"use client"
import { Suspense, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { t } from "@/lib/market/i18n"

function CollectTempContent() {
  const searchParams = useSearchParams()
  const taskId = searchParams.get("taskId")
  const [tempData, setTempData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { if (taskId) loadTempData() }, [taskId])

  const loadTempData = async () => {
    if (!taskId) return
    setLoading(true)
    try {
      const res = await fetch("/api/market/admin/acquisition", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load_collect_temp", taskId })
      })
      const json = await res.json()
      if (json.success) setTempData(json.data || [])
      else setError(json.error || "Failed to load")
    } catch { setError("Failed to load collected data") }
    finally { setLoading(false) }
  }

  const handleSync = async () => {
    if (!taskId) return
    setSyncing(true)
    try {
      const res = await fetch("/api/market/admin/acquisition", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_temp_to_bloggers", taskId })
      })
      const json = await res.json()
      if (json.success) { alert("Sync successful"); await loadTempData() }
      else setError("Sync failed")
    } catch { setError("Sync failed") }
    finally { setSyncing(false) }
  }

  if (!taskId) return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive">
        <AlertTitle>{t("missing_param")}</AlertTitle>
        <AlertDescription>{t("enter_from_task")}</AlertDescription>
      </Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <h1 className="text-xl sm:text-3xl font-bold">{t("collect_temp_title")}</h1>
        <Button onClick={handleSync} disabled={syncing || tempData.filter((i: any) => !i.isSync && i.isValid).length === 0}>
          {syncing ? t("syncing") : t("sync_to_pool")}
        </Button>
      </div>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nickname</TableHead><TableHead>Platform</TableHead><TableHead>Followers</TableHead>
              <TableHead>Email</TableHead><TableHead>Profile</TableHead><TableHead>Category</TableHead>
              <TableHead>Status</TableHead><TableHead>Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : tempData.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">{t("no_collect_data")}</TableCell></TableRow>
            ) : tempData.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.platform}</TableCell>
                <TableCell>{item.followers}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">{item.email}
                    <span className={cn("px-1.5 py-0.5 rounded text-xs", item.isValid || item.is_valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                      {item.isValid || item.is_valid ? "Valid" : "Invalid"}
                    </span>
                  </span>
                </TableCell>
                <TableCell><a href={item.homeUrl || item.home_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a></TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell><span className={cn("px-2 py-1 rounded-full text-xs", item.isValid || item.is_valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{item.isValid || item.is_valid ? "Valid" : "Invalid"}</span></TableCell>
                <TableCell><span className={cn("px-2 py-1 rounded-full text-xs", item.isSync || item.is_sync ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800")}>{item.isSync || item.is_sync ? "Synced" : "Pending"}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-4 text-sm text-gray-500">Only unsynced valid records will be synced to the pool</p>
    </div>
  )
}

export default function CollectTempPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><Skeleton className="h-96 w-full rounded-xl" /></div>}>
      <CollectTempContent />
    </Suspense>
  )
}
