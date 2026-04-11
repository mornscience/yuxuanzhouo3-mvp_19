﻿"use client"
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
import { t } from "@/lib/market/i18n"

export default function EnterpriseCollectTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({ taskName: '', platform: '天眼查', keyword: '', maxLimit: 1000 })
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/market/admin/acquisition', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setTasks(json.data.enterpriseCollectTasks || [])
    } catch { setError('加载任务失败') }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newTask.taskName || !newTask.keyword) { setError('请填写任务名称和关键词'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/market/admin/acquisition', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_enterprise_collect_task', ...newTask })
      })
      const json = await res.json()
      if (json.success) {
        setNewTask({ taskName: '', platform: '天眼查', keyword: '', maxLimit: 1000 })
        await loadTasks()
      } else setError(json.error || '创建任务失败')
    } catch { setError('创建任务失败') }
    finally { setCreating(false) }
  }

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await fetch('/api/market/admin/acquisition', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_enterprise_task_status', taskId, status })
      })
      await loadTasks()
    } catch { setError('更新任务状态失败') }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("enterprise_collect_tasks")}</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="mb-8">
        <CardHeader><CardTitle>{t("new_collect_task")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{t("task_name")}</Label><Input value={newTask.taskName} onChange={e => setNewTask({...newTask, taskName: e.target.value})} placeholder="请输入任务名称" /></div>
            <div>
              <Label>{t("source_platform")}</Label>
              <Select value={newTask.platform} onValueChange={v => setNewTask({...newTask, platform: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="天眼查">天眼查</SelectItem>
                  <SelectItem value="企查查">企查查</SelectItem>
                  <SelectItem value="爱企查">爱企查</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("industry_keyword")}</Label><Input value={newTask.keyword} onChange={e => setNewTask({...newTask, keyword: e.target.value})} placeholder="如：AI、医疗、新能源" /></div>
            <div><Label>{t("collect_limit")}</Label><Input type="number" value={newTask.maxLimit} onChange={e => setNewTask({...newTask, maxLimit: parseInt(e.target.value)})} max={1000} /></div>
          </div>
          <Button onClick={handleCreate} disabled={creating}>{creating ? t("creating") : t("create_task")}</Button>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>任务名称</TableHead><TableHead>平台</TableHead><TableHead>关键词</TableHead>
              <TableHead>上限</TableHead><TableHead>已采集</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead>
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
                <TableCell>{task.totalCollect}</TableCell>
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
                    <Button size="sm" variant="outline" onClick={() => router.push(`/market/enterprise-collect-temp?taskId=${task.id}`)}>{t("view_data")}</Button>
                    {task.status === 'running' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(task.id, 'paused')}>{t("pause")}</Button>}
                    {task.status === 'paused' && <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'running')}>{t("resume")}</Button>}
                    {task.status === 'waiting' && <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'running')}>{t("start")}</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
