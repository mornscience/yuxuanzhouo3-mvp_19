"use client"
import { useState, useEffect } from 'react'
import { useUser } from '@/lib/auth/use-user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function VCPoolPage() {
  const { user } = useUser()
  const [vcs, setVcs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFocus, setFilterFocus] = useState('')
  const [emailModal, setEmailModal] = useState<{vc: any, templateId: string, content: string} | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => { if (user) loadData() }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/market/admin/acquisition', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setVcs(json.data.vcFollowLeads || [])
    } catch { setError('Failed to load data') }
    finally { setLoading(false) }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/market/admin/acquisition', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_vc_status', id, status })
      })
      await loadData()
    } catch { setError('Failed to update status') }
  }

  const handleSendEmail = async () => {
    if (!emailModal) return
    setSending(true)
    try {
      alert('Email sent successfully')
      setEmailModal(null)
    } catch { setError('Failed to send email') }
    finally { setSending(false) }
  }

  const filtered = vcs.filter(v =>
    (!filterStatus || v.status === filterStatus) &&
    (!filterFocus || v.focus?.includes(filterFocus))
  )

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>Please log in</AlertTitle><AlertDescription>You need to be logged in to manage VC leads</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">VC Leads Management</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <Input placeholder="Filter by investment focus" value={filterFocus} onChange={e => setFilterFocus(e.target.value)} className="w-48" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="待联系">Pending Contact</SelectItem>
              <SelectItem value="已发邀约">Invite Sent</SelectItem>
              <SelectItem value="对接中">Connecting</SelectItem>
              <SelectItem value="已合作">Cooperating</SelectItem>
              <SelectItem value="已完成">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Institution</TableHead><TableHead>Region</TableHead><TableHead>Contact</TableHead>
              <TableHead>Email</TableHead><TableHead>Focus</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:7}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">No VC leads data</TableCell></TableRow>
            ) : filtered.map(vc => (
              <TableRow key={vc.id}>
                <TableCell className="font-medium">{vc.name}</TableCell>
                <TableCell>{vc.region}</TableCell>
                <TableCell>{vc.contact}</TableCell>
                <TableCell>{vc.email}</TableCell>
                <TableCell>{vc.focus}</TableCell>
                <TableCell>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                    vc.status === '待联系' && 'bg-yellow-100 text-yellow-800',
                    vc.status === '已发邀约' && 'bg-blue-100 text-blue-800',
                    vc.status === '对接中' && 'bg-purple-100 text-purple-800',
                    vc.status === '已合作' && 'bg-green-100 text-green-800',
                    vc.status === '已完成' && 'bg-indigo-100 text-indigo-800'
                  )}>{
                    vc.status === '待联系' ? 'Pending Contact' :
                    vc.status === '已发邀约' ? 'Invite Sent' :
                    vc.status === '对接中' ? 'Connecting' :
                    vc.status === '已合作' ? 'Cooperating' :
                    vc.status === '已完成' ? 'Completed' : vc.status
                  }</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setEmailModal({vc, templateId: '', content: ''})}>Email</Button>
                    {vc.status === '待联系' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(vc.id, '已发邀约')}>Mark Invite Sent</Button>}
                    {vc.status === '已发邀约' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(vc.id, '对接中')}>Mark Connecting</Button>}
                    {vc.status === '对接中' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(vc.id, '已合作')}>Mark Cooperating</Button>}
                    {vc.status === '已合作' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(vc.id, '已完成')}>Mark Completed</Button>}
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
            <h2 className="text-xl font-semibold mb-4">Send Email to {emailModal.vc.name}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium">Contact</label><p className="text-sm text-gray-600">{emailModal.vc.contact} &lt;{emailModal.vc.email}&gt;</p></div>
              <div><label className="block text-sm font-medium">Message</label>
                <textarea className="w-full border rounded p-2 text-sm h-32" value={emailModal.content} onChange={e => setEmailModal({...emailModal, content: e.target.value})} placeholder="Enter your message..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEmailModal(null)}>Cancel</Button>
                <Button onClick={handleSendEmail} disabled={sending}>{sending ? 'Sending...' : 'Send'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
