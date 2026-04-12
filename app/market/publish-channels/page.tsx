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
  const [form, setForm] = useState({ name: '', platform: 'YouTube', account: '', token: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (user) loadChannels() }, [user])

  const loadChannels = async () => {
    if (!user) return
    setLoading(true)
    try { setChannels(await loadPublishChannels(user.userId)) }
    catch { setError('Failed to load channels') }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!user) return
    if (channels.length >= 10) { setError('Maximum 10 channels allowed'); return }
    setSaving(true)
    try {
      await createPublishChannel(user.userId, form)
      setForm({ name: '', platform: 'YouTube', account: '', token: '' })
      await loadChannels()
    } catch (err: any) {
      setError('Failed to create channel')
    }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this channel?')) return
    try { await deletePublishChannel(user.userId, id); await loadChannels() }
    catch { setError('Failed to delete') }
  }

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>Please log in</AlertTitle><AlertDescription>You need to be logged in to manage publish channels</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Publish Channels</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="mb-8">
        <CardHeader><CardTitle>Add Channel</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">Note: Maximum 10 channels allowed</p>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Channel Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Enter channel name" /></div>
            <div>
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={v => setForm({...form, platform: v})}>
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
            <div><Label>Account</Label><Input value={form.account} onChange={e => setForm({...form, account: e.target.value})} placeholder="Enter account" /></div>
            <div><Label>Token (optional)</Label><Input value={form.token} onChange={e => setForm({...form, token: e.target.value})} placeholder="API Token" /></div>
          </div>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Adding...' : 'Add Channel'}</Button>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Platform</TableHead><TableHead>Account</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:3}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:5}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : channels.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">No channels yet</TableCell></TableRow>
            ) : channels.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.platform}</TableCell>
                <TableCell>{c.account}</TableCell>
                <TableCell><span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{c.status}</span></TableCell>
                <TableCell><Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>Delete</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
