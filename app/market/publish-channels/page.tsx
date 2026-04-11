﻿"use client"
import { useState, useEffect } from 'react'
import { useUser } from '@/lib/auth/use-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export default function PublishChannelsPage() {
  const { user } = useUser()
  const [channels, setChannels] = useState<PublishChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', platform: '抖音', account: '', token: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (user) loadChannels() }, [user])

  const loadChannels = async () => {
    if (!user) return
    setLoading(true)
    try { setChannels(await loadPublishChannels(user.id)) }
    catch { setError('加载频道失败') }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!user) return
    if (channels.length >= 10) { setError('最多只能添加 10 个频道'); return }
    setSaving(true)
    try {
      await createPublishChannel(user.id, form)
      setForm({ name: '', platform: '抖音', account: '', token: '' })
      await loadChannels()
    } catch (err: any) {
      if (err.message === '最多只能添加 10 个频道') setError('最多只能添加 10 个频道')
      else setError('创建失败')
    }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('确定要删除这个频道吗？')) return
    try { await deletePublishChannel(user.id, id); await loadChannels() }
    catch { setError('删除失败') }
  }

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>请先登录</AlertTitle><AlertDescription>登录后才能管理发布频道</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">发布频道管理</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="mb-8">
        <CardHeader><CardTitle>添加频道</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">提示：最多只能添加 10 个频道</p>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>频道名称</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="请输入频道名称" /></div>
            <div>
              <Label>平台</Label>
              <Select value={form.platform} onValueChange={v => setForm({...form, platform: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="抖音">抖音</SelectItem>
                  <SelectItem value="小红书">小红书</SelectItem>
                  <SelectItem value="微博">微博</SelectItem>
                  <SelectItem value="B站">B站</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>账号</Label><Input value={form.account} onChange={e => setForm({...form, account: e.target.value})} placeholder="请输入账号" /></div>
            <div><Label>Token（可选）</Label><Input value={form.token} onChange={e => setForm({...form, token: e.target.value})} placeholder="API Token" /></div>
          </div>
          <Button onClick={handleCreate} disabled={saving}>{saving ? '添加中...' : '添加频道'}</Button>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>频道名称</TableHead><TableHead>平台</TableHead><TableHead>账号</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:3}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:5}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : channels.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">暂无发布频道</TableCell></TableRow>
            ) : channels.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.platform}</TableCell>
                <TableCell>{c.account}</TableCell>
                <TableCell><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{c.status}</span></TableCell>
                <TableCell><Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>删除</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}