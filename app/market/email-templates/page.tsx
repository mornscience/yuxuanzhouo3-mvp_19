﻿"use client"
import { useState, useEffect } from 'react'
import { useUser } from '@/lib/auth/use-user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export default function EmailTemplatesPage() {
  const { user } = useUser()
  const [templates, setTemplates] = useState<BloggerEmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', subject: '', content: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (user) loadTemplates() }, [user])

  const loadTemplates = async () => {
    if (!user) return
    setLoading(true)
    try { setTemplates(await loadEmailTemplates(user.id)) }
    catch { setError('加载模板失败') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      if (editId) { await updateEmailTemplate(user.id, editId, form); setEditId(null) }
      else await createEmailTemplate(user.id, form)
      setForm({ title: '', subject: '', content: '' })
      await loadTemplates()
    } catch { setError('保存失败') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('确定要删除这个模板吗？')) return
    try { await deleteEmailTemplate(user.id, id); await loadTemplates() }
    catch { setError('删除失败') }
  }

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>请先登录</AlertTitle><AlertDescription>登录后才能管理邮件模板</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">博主邮件模板管理</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="mb-8">
        <CardHeader><CardTitle>{editId ? '编辑模板' : '新建模板'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>模板名称</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="请输入模板名称" /></div>
          <div><Label>邮件主题</Label><Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="请输入邮件主题" /></div>
          <div><Label>邮件内容</Label><textarea className="w-full border rounded p-2 text-sm h-32" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="请输入邮件内容" /></div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : editId ? '更新' : '创建'}</Button>
            {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ title: '', subject: '', content: '' }) }}>取消</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>模板名称</TableHead><TableHead>邮件主题</TableHead><TableHead>创建时间</TableHead><TableHead>操作</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:3}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:4}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : templates.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">暂无邮件模板</TableCell></TableRow>
            ) : templates.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.subject}</TableCell>
                <TableCell>{t.createdAt?.slice(0,10)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditId(t.id); setForm({ title: t.title, subject: t.subject, content: t.content }) }}>编辑</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>删除</Button>
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