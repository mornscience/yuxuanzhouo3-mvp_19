﻿"use client"
import { Suspense, useState, useEffect } from 'react'
import { useUser } from '@/lib/auth/use-user'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import { loadEnterpriseCollectTempData, syncEnterpriseTempToLeads } from '@/lib/market/acquisition'
import type { EnterpriseCollectTemp } from '@/lib/market/acquisition-types'

function EnterpriseCollectTempContent() {
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
    try { setTempData(await loadEnterpriseCollectTempData(user.userId, taskId)) }
    catch { setError('Failed to load collected data') }
    finally { setLoading(false) }
  }

  const handleSync = async () => {
    if (!user || !taskId) return
    setSyncing(true)
    try {
      const result = await syncEnterpriseTempToLeads(user.userId, taskId)
      if (result.success) { alert(`Successfully synced ${result.count} records to pool`); await loadTempData() }
      else setError('Sync failed')
    } catch { setError('Sync failed') }
    finally { setSyncing(false) }
  }

  if (!user) return (
    <div className="container mx-auto px-4 py-8">
      <Alert><AlertTitle>Please log in</AlertTitle><AlertDescription>You need to be logged in to view collected data</AlertDescription></Alert>
    </div>
  )
  if (!taskId) return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive"><AlertTitle>Missing parameter</AlertTitle><AlertDescription>Please enter from the collect tasks page</AlertDescription></Alert>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Enterprise Collected Data</h1>
        <Button onClick={handleSync} disabled={syncing || tempData.filter(i => !i.isSync && i.isValid).length === 0}>
          {syncing ? 'Syncing...' : 'Sync to Pool'}
        </Button>
      </div>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead><TableHead>Region</TableHead><TableHead>Contact</TableHead>
              <TableHead>Email</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead>Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:7}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : tempData.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">No collected data</TableCell></TableRow>
            ) : tempData.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.region}</TableCell>
                <TableCell>{item.contact}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">{item.email}
                    <span className={cn('px-1.5 py-0.5 rounded text-xs', item.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>{item.isValid ? 'Valid' : 'Invalid'}</span>
                  </span>
                </TableCell>
                <TableCell>{item.source}</TableCell>
                <TableCell><span className={cn('px-2 py-1 rounded-full text-xs', item.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>{item.isValid ? 'Valid' : 'Invalid'}</span></TableCell>
                <TableCell><span className={cn('px-2 py-1 rounded-full text-xs', item.isSync ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')}>{item.isSync ? 'Synced' : 'Pending'}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-4 text-sm text-gray-500">Only unsynced valid records will be synced to the pool</p>
    </div>
  )
}

export default function EnterpriseCollectTempPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><Skeleton className="h-96 w-full rounded-xl" /></div>}>
      <EnterpriseCollectTempContent />
    </Suspense>
  )
}
