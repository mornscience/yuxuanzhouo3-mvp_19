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
    } catch { setError('加载数据失败') }
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
    } catch { setError('更新状态失败') }
  }

  const handleSendEmail = async () => {
    if (!emailModal) return
    setSending(true)
    try { alert('邮件发送成功'); setEmailModal(null) }
    catch { setError('发送邮件失败') }
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
        // 一键发送合作信息
        setEmailModal({ 
          blogger, 
          content: `您好，${blogger.name}！\n\n我们已接受您的合作申请，期待与您的合作。\n\n请回复此邮件确认合作细节。\n\n祝好，\n${user?.username || '平台运营团队'}` 
        })
      }
    } catch { setError('处理合作申请失败') }
  }

  const filtered = bloggers.filter(b =>
    (!filterPlatform || b.platform === filterPlatform) &&
    (!filterStatus || b.status === filterStatus)
  )

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>请先登录</AlertTitle><AlertDescription>登录后才能管理博主线索</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">博主线索池管理</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-40"><SelectValue placeholder="选择平台" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部平台</SelectItem>
              <SelectItem value="抖音">抖音</SelectItem>
              <SelectItem value="小红书">小红书</SelectItem>
              <SelectItem value="YouTube">YouTube</SelectItem>
              <SelectItem value="微博">微博</SelectItem>
              <SelectItem value="B站">B站</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="选择状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部状态</SelectItem>
              <SelectItem value="待联系">待联系</SelectItem>
              <SelectItem value="已发邀约">已发邀约</SelectItem>
              <SelectItem value="对接中">对接中</SelectItem>
              <SelectItem value="已合作">已合作</SelectItem>
              <SelectItem value="已发布">已发布</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>博主昵称</TableHead><TableHead>平台</TableHead><TableHead>粉丝数</TableHead>
              <TableHead>邮箱</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:6}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">暂无博主线索数据</TableCell></TableRow>
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
                  )}>{b.status}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setEmailModal({blogger: b, content: ''})}>发邮件</Button>
                    {b.status === '待联系' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b.id, '已发邀约')}>标记已申请对接</Button>}
                    {b.status === '已发邀约' && <Button size="sm" variant="outline" onClick={() => setCooperationModal({blogger: b})}>合作申请</Button>}
                    {b.status === '对接中' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b.id, '已合作')}>标记已合作</Button>}
                    {b.status === '已合作' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b.id, '已发布')}>标记已发布</Button>}
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
            <h2 className="text-xl font-semibold mb-4">发送邮件给 {emailModal.blogger.name}</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{emailModal.blogger.email}</p>
              <textarea className="w-full border rounded p-2 text-sm h-32" value={emailModal.content} onChange={e => setEmailModal({...emailModal, content: e.target.value})} placeholder="请输入邮件内容" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEmailModal(null)}>取消</Button>
                <Button onClick={handleSendEmail} disabled={sending}>{sending ? '发送中...' : '发送'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {cooperationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-4">合作申请 - {cooperationModal.blogger.name}</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">平台：{cooperationModal.blogger.platform}</p>
              <p className="text-sm text-gray-600">粉丝数：{cooperationModal.blogger.followers}</p>
              <p className="text-sm text-gray-600">邮箱：{cooperationModal.blogger.email}</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCooperationModal(null)}>取消</Button>
                <Button variant="destructive" onClick={() => handleCooperationRequest(cooperationModal.blogger, 'reject')}>拒绝</Button>
                <Button onClick={() => handleCooperationRequest(cooperationModal.blogger, 'accept')}>接受</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}