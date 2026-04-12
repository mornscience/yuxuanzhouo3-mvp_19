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
    try { setTemplates(await loadEmailTemplates(user.userId)) }
    catch { setError('Failed to load templates') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      if (editId) { await updateEmailTemplate(user.userId, editId, form); setEditId(null) }
      else await createEmailTemplate(user.userId, form)
      setForm({ title: '', subject: '', content: '' })
      await loadTemplates()
    } catch { setError('Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this template?')) return
    try { await deleteEmailTemplate(user.userId, id); await loadTemplates() }
    catch { setError('Failed to delete') }
  }

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>Please log in</AlertTitle><AlertDescription>You need to be logged in to manage email templates</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blogger Email Templates</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="mb-8">
        <CardHeader><CardTitle>{editId ? 'Edit Template' : 'New Template'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Template Name</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Enter template name" /></div>
          <div><Label>Email Subject</Label><Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Enter email subject" /></div>
          <div><Label>Email Content</Label><textarea className="w-full border rounded p-2 text-sm h-32" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Enter email content" /></div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</Button>
            {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ title: '', subject: '', content: '' }) }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Subject</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:3}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:4}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : templates.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">No email templates yet</TableCell></TableRow>
            ) : templates.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.subject}</TableCell>
                <TableCell>{t.createdAt?.slice(0,10)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditId(t.id); setForm({ title: t.title, subject: t.subject, content: t.content }) }}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>Delete</Button>
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
