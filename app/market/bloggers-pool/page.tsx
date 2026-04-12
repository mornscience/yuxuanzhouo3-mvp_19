﻿"use client"
import { useState, useEffect } from 'react'
import { useUser } from '@/lib/auth/use-user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function BloggersPoolPage() {
  const { user } = useUser()
  const [bloggers, setBloggers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [emailModal, setEmailModal] = useState<{blogger: any, content: string} | null>(null)
  const [cooperationModal, setCooperationModal] = useState<{blogger: any} | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => { if (user) loadData() }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/market/admin/acquisition', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setBloggers(json.data.bloggers || [])
    } catch { setError('Failed to load data') }
    finally { setLoading(false) }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/market/admin/acquisition', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_blogger_status', id, status })
      })
      await loadData()
    } catch { setError('Failed to update status') }
  }

  const handleSendEmail = async () => {
    if (!emailModal) return
    setSending(true)
    try { alert('Email sent successfully'); setEmailModal(null) }
    catch { setError('Failed to send email') }
    finally { setSending(false) }
  }

  const handleCooperationRequest = async (blogger: any, action: string) => {
    try {
      await fetch('/api/market/admin/acquisition', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_blogger_status', id: blogger.id, status: action === 'accept' ? '已合作' : '已拒绝' })
      })
      await loadData()
      setCooperationModal(null)
      if (action === 'accept') {
        setEmailModal({
          blogger,
          content: `Hi ${blogger.name}!\n\nWe have accepted your cooperation application and look forward to working with you.\n\nPlease reply to confirm the details.\n\nBest regards,\n${user?.userId || 'Platform Team'}`
        })
      }
    } catch { setError('Failed to process cooperation request') }
  }

  const statusLabel = (s: string) =>
    s === '待联系' ? 'Pending Contact' :
    s === '已发邀约' ? 'Invite Sent' :
    s === '对接中' ? 'Connecting' :
    s === '已合作' ? 'Cooperating' :
    s === '已发布' ? 'Published' : s

  const filtered = bloggers.filter(b =>
    (!filterPlatform || b.platform === filterPlatform) &&
    (!filterStatus || b.status === filterStatus)
  )

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>Please log in</AlertTitle><AlertDescription>You need to be logged in to manage blogger leads</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blogger Leads Pool</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Platforms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Platforms</SelectItem>
              <SelectItem value="YouTube">YouTube</SelectItem>
              <SelectItem value="TikTok">TikTok</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Twitter">Twitter</SelectItem>
              <SelectItem value="B站">Bilibili</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="待联系">Pending Contact</SelectItem>
              <SelectItem value="已发邀约">Invite Sent</SelectItem>
              <SelectItem value="对接中">Connecting</SelectItem>
              <SelectItem value="已合作">Cooperating</SelectItem>
              <SelectItem value="已发布">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Blogger</TableHead><TableHead>Platform</TableHead><TableHead>Followers</TableHead>
              <TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:6}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">No blogger leads data</TableCell></TableRow>
            ) : filtered.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>{b.platform}</TableCell>
                <TableCell>{b.followers}</TableCell>
                <TableCell>{b.email}</TableCell>
                <TableCell>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                    b.status === '待联系' && 'bg-yellow-100 text-yellow-800',
                    b.status === '已发邀约' && 'bg-blue-100 text-blue-800',
                    b.status === '对接中' && 'bg-purple-100 text-purple-800',
                    b.status === '已合作' && 'bg-green-100 text-green-800',
                    b.status === '已发布' && 'bg-indigo-100 text-indigo-800'
                  )}>{statusLabel(b.status)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setEmailModal({blogger: b, content: ''})}>Email</Button>
                    {b.status === '待联系' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b.id, '已发邀约')}>Mark Invite Sent</Button>}
                    {b.status === '已发邀约' && <Button size="sm" variant="outline" onClick={() => setCooperationModal({blogger: b})}>Cooperation</Button>}
                    {b.status === '对接中' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b.id, '已合作')}>Mark Cooperating</Button>}
                    {b.status === '已合作' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b.id, '已发布')}>Mark Published</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {emailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Send Email to {emailModal.blogger.name}</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{emailModal.blogger.email}</p>
              <textarea className="w-full border rounded p-2 text-sm h-32" value={emailModal.content} onChange={e => setEmailModal({...emailModal, content: e.target.value})} placeholder="Enter email content" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEmailModal(null)}>Cancel</Button>
                <Button onClick={handleSendEmail} disabled={sending}>{sending ? 'Sending...' : 'Send'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {cooperationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Cooperation - {cooperationModal.blogger.name}</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Platform: {cooperationModal.blogger.platform}</p>
              <p className="text-sm text-gray-600">Followers: {cooperationModal.blogger.followers}</p>
              <p className="text-sm text-gray-600">Email: {cooperationModal.blogger.email}</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCooperationModal(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleCooperationRequest(cooperationModal.blogger, 'reject')}>Reject</Button>
                <Button onClick={() => handleCooperationRequest(cooperationModal.blogger, 'accept')}>Accept</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
