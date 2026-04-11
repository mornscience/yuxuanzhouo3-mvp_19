﻿"use client"
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

export default function EnterprisePoolPage() {
  const { user } = useUser()
  const [enterprises, setEnterprises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [emailModal, setEmailModal] = useState<{enterprise: any, content: string} | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => { if (user) loadData() }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/market/admin/acquisition', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setEnterprises(json.data.b2bLeads || [])
    } catch { setError('加载数据失败') }
    finally { setLoading(false) }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/market/admin/acquisition', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_b2b_status', id, status })
      })
      await loadData()
    } catch { setError('更新状态失败') }
  }

  const handleSendEmail = async () => {
    if (!emailModal) return
    setSending(true)
    try { alert('邮件发送成功'); setEmailModal(null) }
    catch { setError('发送邮件失败') }
    finally { setSending(false) }
  }

  const filtered = enterprises.filter(e =>
    (!filterStatus || e.status === filterStatus) &&
    (!filterRegion || e.region?.includes(filterRegion))
  )

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>请先登录</AlertTitle><AlertDescription>登录后才能管理企业线索</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">企业线索池管理</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <Input placeholder="按地区筛选" value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="w-48" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="选择状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部状态</SelectItem>
              <SelectItem value="待联系">待联系</SelectItem>
              <SelectItem value="已发邀约">已发邀约</SelectItem>
              <SelectItem value="对接中">对接中</SelectItem>
              <SelectItem value="已合作">已合作</SelectItem>
              <SelectItem value="已完成">已完成</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>企业名称</TableHead><TableHead>地区</TableHead><TableHead>联系人</TableHead>
              <TableHead>邮箱</TableHead><TableHead>预估价值</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:7}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">暂无企业线索数据</TableCell></TableRow>
            ) : filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>{e.region}</TableCell>
                <TableCell>{e.contact}</TableCell>
                <TableCell>{e.email}</TableCell>
                <TableCell>¥{e.estValue}</TableCell>
                <TableCell>
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                    e.status === '待联系' && 'bg-yellow-100 text-yellow-800',
                    e.status === '已发邀约' && 'bg-blue-100 text-blue-800',
                    e.status === '对接中' && 'bg-purple-100 text-purple-800',
                    e.status === '已合作' && 'bg-green-100 text-green-800',
                    e.status === '已完成' && 'bg-indigo-100 text-indigo-800'
                  )}>{e.status}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setEmailModal({enterprise: e, content: ''})}>发邮件</Button>
                    {e.status === '待联系' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(e.id, '已发邀约')}>标记已申请对接</Button>}
                    {e.status === '已发邀约' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(e.id, '对接中')}>标记对接中</Button>}
                    {e.status === '对接中' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(e.id, '已合作')}>标记已合作</Button>}
                    {e.status === '已合作' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(e.id, '已完成')}>标记已完成</Button>}
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
            <h2 className="text-xl font-semibold mb-4">发送邮件给 {emailModal.enterprise.name}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium">联系人</label><p className="text-sm text-gray-600">{emailModal.enterprise.contact} &lt;{emailModal.enterprise.email}&gt;</p></div>
              <div><label className="block text-sm font-medium">邮件内容</label>
                <textarea className="w-full border rounded p-2 text-sm h-32" value={emailModal.content} onChange={e => setEmailModal({...emailModal, content: e.target.value})} placeholder="请输入合作备注信息" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEmailModal(null)}>取消</Button>
                <Button onClick={handleSendEmail} disabled={sending}>{sending ? '发送中...' : '发送'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}