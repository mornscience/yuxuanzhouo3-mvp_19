"use client"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { t } from "@/lib/market/i18n"

export default function BloggerCollectTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({ taskName: '', platform: 'YouTube', keyword: '', maxLimit: 1000 })
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/market/admin/acquisition', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setTasks(json.data.collectTasks || [])
    } catch { setError('Failed to load tasks') }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newTask.taskName || !newTask.keyword) { setError('Please fill in task name and keyword'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/market/admin/acquisition', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_collect_task', ...newTask })
      })
      const json = await res.json()
      if (json.success) {
        setNewTask({ taskName: '', platform: 'YouTube', keyword: '', maxLimit: 1000 })
        await loadTasks()
      } else setError(json.error || 'Failed to create task')
    } catch { setError('Failed to create task') }
    finally { setCreating(false) }
  }

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await fetch('/api/market/admin/acquisition', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_collect_task_status', taskId, status })
      })
      await loadTasks()
    } catch { setError('Failed to update task status') }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/market/collect-tasks"><ArrowLeft size={16} /> {t("back")}</Link>
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold">{t("blogger_collect_mgmt")}</h1>
      </div>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="mb-8">
        <CardHeader><CardTitle>{t("new_collect_task")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>{t("task_name")}</Label><Input value={newTask.taskName} onChange={e => setNewTask({...newTask, taskName: e.target.value})} placeholder="Enter task name" /></div>
            <div>
              <Label>{t("source_platform")}</Label>
              <Select value={newTask.platform} onValueChange={v => setNewTask({...newTask, platform: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="B站">Bilibili</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("keyword")}</Label><Input value={newTask.keyword} onChange={e => setNewTask({...newTask, keyword: e.target.value})} placeholder="e.g. Beauty, Tech, Food" /></div>
            <div><Label>{t("collect_limit")}</Label><Input type="number" value={newTask.maxLimit} onChange={e => setNewTask({...newTask, maxLimit: parseInt(e.target.value)})} max={1000} min={1} /></div>
          </div>
          <Button onClick={handleCreate} disabled={creating}>{creating ? t("creating") : t("create_task")}</Button>
        </CardContent>
      </Card>
      <Card>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("task_name")}</TableHead><TableHead>{t("source_platform")}</TableHead><TableHead>{t("keyword")}</TableHead>
              <TableHead>{t("collect_limit")}</TableHead><TableHead>Collected</TableHead><TableHead>{t("status")}</TableHead><TableHead>{t("operation")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:3}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:7}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>
            )) : tasks.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">{t("no_collect_tasks")}</TableCell></TableRow>
            ) : tasks.map((task: any) => (
              <TableRow key={task.id}>
                <TableCell>{task.taskName}</TableCell>
                <TableCell>{task.platform}</TableCell>
                <TableCell>{task.keyword}</TableCell>
                <TableCell>{task.maxLimit}</TableCell>
                <TableCell>{task.totalCollect || 0}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                    {task.status === 'waiting' && t("waiting")}
                    {task.status === 'running' && t("running")}
                    {task.status === 'paused' && t("paused")}
                    {task.status === 'completed' && t("completed")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/market/collect-temp?taskId=${task.id}`)}>{t("view_data")}</Button>
                    {task.status === 'running' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(task.id, 'paused')}>{t("pause")}</Button>}
                    {task.status === 'paused' && <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'running')}>{t("resume")}</Button>}
                    {task.status === 'waiting' && <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'running')}>{t("start")}</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </Card>
    </div>
  )
}
