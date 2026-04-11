﻿"use client"
import { useState, useEffect } from 'react'
import { useUser } from '@/lib/auth/use-user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

export default function EnterpriseCollectTempPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const taskId = searchParams.get('taskId')
  const [tempData, setTempData] = useState<EnterpriseCollectTemp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => { if (user && taskId) loadTempData() }, [user, taskId])

  const loadTempData = async () => {
    if (!user || !taskId) return
    setLoading(true)
    try { setTempData(await loadEnterpriseCollectTempData(user.id, taskId)) }
    catch { setError('加载采集数据失败') }
    finally { setLoading(false) }
  }

  const handleSync = async () => {
    if (!user || !taskId) return
    setSyncing(true)
    try {
      const result = await syncEnterpriseTempToLeads(user.id, taskId)
      if (result.success) { alert(`成功同步 ${result.count} 条数据到线索池`); await loadTempData() }
      else setError('同步失败')
    } catch { setError('同步失败') }
    finally { setSyncing(false) }
  }

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>请先登录</AlertTitle><AlertDescription>登录后才能查看采集数据</AlertDescription></Alert>
    </div>
  )
  if (!taskId) return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive"><AlertTitle>缺少参数</AlertTitle><AlertDescription>请从采集任务页面进入</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">企业采集临时数据</h1>
        <Button onClick={handleSync} disabled={syncing || tempData.filter(i => !i.isSync && i.isValid).length === 0}>
          {syncing ? '同步中...' : '同步到线索池'}
        </Button>
      </div>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>企业名称</TableHead><TableHead>地区</TableHead><TableHead>联系人</TableHead>
              <TableHead>邮箱</TableHead><TableHead>来源</TableHead><TableHead>状态</TableHead><TableHead>同步状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:7}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : tempData.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">暂无采集数据</TableCell></TableRow>
            ) : tempData.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.region}</TableCell>
                <TableCell>{item.contact}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">{item.email}
                    <span className={cn('px-1.5 py-0.5 rounded text-xs', item.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>{item.isValid ? '有效' : '无效'}</span>
                  </span>
                </TableCell>
                <TableCell>{item.source}</TableCell>
                <TableCell><span className={cn('px-2 py-1 rounded-full text-xs', item.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>{item.isValid ? '有效' : '无效'}</span></TableCell>
                <TableCell><span className={cn('px-2 py-1 rounded-full text-xs', item.isSync ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')}>{item.isSync ? '已同步' : '未同步'}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-4 text-sm text-gray-500">提示：只有未同步且有效的数据会被同步到线索池</p>
    </div>
  )
}