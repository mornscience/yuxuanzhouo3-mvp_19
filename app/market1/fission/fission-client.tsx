"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BarChart3, Database, Users, DollarSign, RefreshCcw, TrendingUp, Gift, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Tab = "overview" | "fission" | "assets" | "withdraw"

const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
  { key: "overview",  label: "总览大盘",   icon: <BarChart3 size={15} /> },
  { key: "fission",   label: "裂变拉新",   icon: <Users size={15} /> },
  { key: "assets",    label: "用户资产",   icon: <Database size={15} /> },
  { key: "withdraw",  label: "提现审核",   icon: <DollarSign size={15} /> },
]

function Stat({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function fmt(n: number) { return Number(n || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 }) }
function fmtDt(v?: string | null) {
  if (!v) return "-"
  const d = new Date(v); return Number.isFinite(d.getTime()) ? d.toLocaleString("zh-CN") : "-"
}

export function FissionClient() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [data, setData] = useState<any>(null)

  // 资产调账表单
  const [adjustForm, setAdjustForm] = useState({ userId: "", assetType: "points", amount: "10", remark: "" })
  // 提现筛选
  const [withdrawStatus, setWithdrawStatus] = useState("all")
  // 裂变筛选
  const [fissionStatus, setFissionStatus] = useState("all")
  // 折扣码发放弹窗
  const [discountModal, setDiscountModal] = useState<{ relationId: string; inviterUserId: string } | null>(null)
  const [discountForm, setDiscountForm] = useState({ discount: "0.8", maxUses: "1", expiresAt: "" })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000) }

  const load = useCallback(async (t = tab) => {
    setLoading(true); setError("")
    try {
      const params = new URLSearchParams({ tab: t })
      if (t === "withdraw") params.set("status", withdrawStatus)
      if (t === "fission") params.set("status", fissionStatus)
      const res = await fetch(`/api/market1/fission?${params}`, { cache: "no-store" })
      if (res.status === 401) { router.replace("/market1/login"); return }
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "加载失败")
      setData(json.data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [tab, withdrawStatus, fissionStatus, router])

  useEffect(() => { void load(tab) }, [tab])

  const post = async (body: Record<string, any>) => {
    const res = await fetch("/api/market1/fission", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || "操作失败")
    return json
  }

  const handleAdjust = async () => {
    if (!adjustForm.userId.trim()) { showToast("请输入用户 ID"); return }
    try {
      await post({ action: "adjust_asset", ...adjustForm, amount: Number(adjustForm.amount) })
      showToast("✅ 调账成功"); void load("assets")
    } catch (e: any) { showToast(`❌ ${e.message}`) }
  }

  const handleReview = async (id: string, reviewAction: "approve" | "reject", note = "") => {
    try {
      await post({ action: "review_withdrawal", id, reviewAction, note })
      showToast(reviewAction === "approve" ? "✅ 已通过" : "已拒绝"); void load("withdraw")
    } catch (e: any) { showToast(`❌ ${e.message}`) }
  }

  const handleIssueDiscount = async () => {
    if (!discountModal) return
    const d = parseFloat(discountForm.discount)
    if (isNaN(d) || d <= 0 || d >= 1) { showToast("折扣比例请填 0.1~0.99（如 0.8 = 八折）"); return }
    try {
      await post({
        action: "issue_discount",
        inviterUserId: discountModal.inviterUserId,
        relationId: discountModal.relationId,
        discount: d,
        maxUses: parseInt(discountForm.maxUses) || 1,
        expiresAt: discountForm.expiresAt || null,
      })
      showToast("✅ 折扣码已发放给邀请人")
      setDiscountModal(null)
    } catch (e: any) { showToast(`❌ ${e.message}`) }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="h-14 border-b bg-background px-6 flex items-center justify-between">
        <div className="font-semibold">4. 营销中台</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load(tab)} disabled={loading} className="gap-1.5">
            <RefreshCcw size={14} />{loading ? "刷新中..." : "刷新"}
          </Button>
          <Button asChild variant="outline" size="sm"><Link href="/market1">返回系统导航</Link></Button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="w-48 border-r bg-background p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition ${tab === t.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6 space-y-4">
          {error && <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {loading && !data && <div className="space-y-3">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>}

          {data && (
            <>
              {/* ── 总览大盘 ── */}
              {tab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat title="分享点击" value={fmt(data.funnel?.totalClicks)} />
                    <Stat title="邀请注册" value={fmt(data.funnel?.totalInvites)} />
                    <Stat title="激活达标" value={fmt(data.funnel?.totalActivated)} sub={`激活率 ${data.funnel?.activationRate}%`} />
                    <Stat title="待审提现" value={`${data.pendingWithdrawals?.count} 笔`} sub={`¥${fmt(data.pendingWithdrawals?.amount)}`} />
                  </div>

                  {/* 转化漏斗 */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp size={14} />裂变核心转化漏斗</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: "分享点击", value: data.funnel?.totalClicks, ratio: 100, color: "bg-blue-500" },
                        { label: "邀请注册", value: data.funnel?.totalInvites, ratio: data.funnel?.conversionRate, color: "bg-violet-500" },
                        { label: "激活达标", value: data.funnel?.totalActivated, ratio: data.funnel?.activationRate, color: "bg-emerald-500" },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold">{fmt(item.value)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted">
                            <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${Math.max(item.ratio || 0, 4)}%` }} />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* 近7天趋势 */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">近 7 日拉新趋势</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex h-32 items-end gap-2">
                        {(data.trends || []).map((item: any) => {
                          const max = Math.max(...(data.trends || []).map((t: any) => t.invites || 0), 1)
                          return (
                            <div key={item.date} className="flex flex-1 flex-col items-center gap-1">
                              <div className="flex h-24 w-full items-end gap-0.5">
                                <div className="w-1/2 rounded-t bg-blue-400" style={{ height: `${Math.max((item.invites / max) * 100, 4)}%` }} />
                                <div className="w-1/2 rounded-t bg-emerald-400" style={{ height: `${Math.max((item.activated / max) * 100, 2)}%` }} />
                              </div>
                              <div className="text-[10px] text-muted-foreground">{item.date?.slice(5)}</div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />邀请</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />激活</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 资产汇总 */}
                  {data.assetTotals && Object.keys(data.assetTotals).length > 0 && (
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-sm">资产汇总</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(data.assetTotals).map(([type, v]: any) => (
                            <div key={type} className="rounded-lg border p-3">
                              <div className="text-xs text-muted-foreground">{type}</div>
                              <div className="font-semibold mt-1">{fmt(v.available)}</div>
                              <div className="text-xs text-muted-foreground">冻结 {fmt(v.frozen)}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* ── 裂变拉新 ── */}
              {tab === "fission" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">邀请关系列表 <span className="text-muted-foreground font-normal text-sm">({data.total || 0} 条)</span></h2>
                    <div className="flex gap-2">
                      <select className="rounded-lg border text-sm px-3 py-1.5" value={fissionStatus} onChange={e => setFissionStatus(e.target.value)}>
                        <option value="all">全部状态</option>
                        <option value="bound">已绑定</option>
                        <option value="activated">已激活</option>
                      </select>
                      <Button size="sm" variant="outline" onClick={() => void load("fission")}>筛选</Button>
                    </div>
                  </div>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>邀请人 ID</TableHead><TableHead>被邀请人 ID</TableHead>
                          <TableHead>邀请码</TableHead><TableHead>状态</TableHead>
                          <TableHead>邀请时间</TableHead><TableHead>激活时间</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!(data.rows?.length) ? (
                          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">暂无邀请关系数据</TableCell></TableRow>
                        ) : data.rows.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{String(r.inviter_user_id || "").slice(0, 14)}…</TableCell>
                            <TableCell className="font-mono text-xs">{String(r.invited_user_id || "").slice(0, 14)}…</TableCell>
                            <TableCell className="font-mono text-xs">{r.share_code}</TableCell>
                            <TableCell>
                              <Badge variant={r.status === "activated" ? "default" : "outline"} className="text-xs">
                                {r.status === "activated" ? "已激活" : "已绑定"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDt(r.created_at)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDt(r.activated_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                onClick={() => setDiscountModal({ relationId: r.id, inviterUserId: r.inviter_user_id })}>
                                <Gift size={12} />发折扣码
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}

              {/* ── 用户资产 ── */}
              {tab === "assets" && (
                <div className="space-y-4">
                  {/* 调账 */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">人工调账</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <Input placeholder="用户 ID" value={adjustForm.userId} onChange={e => setAdjustForm(p => ({...p, userId: e.target.value}))} className="h-9" />
                        <select className="rounded-lg border text-sm px-3 h-9" value={adjustForm.assetType} onChange={e => setAdjustForm(p => ({...p, assetType: e.target.value}))}>
                          {["cash","points","ai_quota","vip_duration"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Input placeholder="数量（负数为扣减）" value={adjustForm.amount} onChange={e => setAdjustForm(p => ({...p, amount: e.target.value}))} className="h-9" />
                        <Input placeholder="备注" value={adjustForm.remark} onChange={e => setAdjustForm(p => ({...p, remark: e.target.value}))} className="h-9" />
                        <Button size="sm" onClick={handleAdjust} className="h-9">确认调账</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 账户列表 */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">用户资产账户 ({data.accounts?.total || 0})</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>用户 ID</TableHead><TableHead>资产类型</TableHead>
                            <TableHead>可用余额</TableHead><TableHead>冻结余额</TableHead>
                            <TableHead>累计获得</TableHead><TableHead>更新时间</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!(data.accounts?.rows?.length) ? (
                            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">暂无资产数据</TableCell></TableRow>
                          ) : data.accounts.rows.map((r: any) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-xs">{String(r.user_id || "").slice(0, 14)}…</TableCell>
                              <TableCell><Badge variant="secondary" className="text-xs">{r.asset_type}</Badge></TableCell>
                              <TableCell className="font-semibold">{fmt(r.available_balance)}</TableCell>
                              <TableCell className="text-muted-foreground">{fmt(r.frozen_balance)}</TableCell>
                              <TableCell className="text-emerald-600">{fmt(r.lifetime_earned)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{fmtDt(r.updated_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* 流水 */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">资产流水 ({data.ledgers?.total || 0})</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>用户 ID</TableHead><TableHead>资产</TableHead>
                            <TableHead>方向</TableHead><TableHead>金额</TableHead>
                            <TableHead>来源</TableHead><TableHead>备注</TableHead><TableHead>时间</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!(data.ledgers?.rows?.length) ? (
                            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">暂无流水</TableCell></TableRow>
                          ) : data.ledgers.rows.map((r: any) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-xs">{String(r.user_id || "").slice(0, 12)}…</TableCell>
                              <TableCell className="text-xs">{r.asset_type}</TableCell>
                              <TableCell>
                                <span className={`text-xs font-medium ${r.direction === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                                  {r.direction === "credit" ? "+" : "-"}
                                </span>
                              </TableCell>
                              <TableCell className="font-semibold">{fmt(r.amount)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{r.source_type}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{r.remark || "-"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{fmtDt(r.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── 提现审核 ── */}
              {tab === "withdraw" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">提现申请 <span className="text-muted-foreground font-normal text-sm">({data.total || 0} 条)</span></h2>
                    <div className="flex gap-2">
                      <select className="rounded-lg border text-sm px-3 py-1.5" value={withdrawStatus} onChange={e => setWithdrawStatus(e.target.value)}>
                        <option value="all">全部</option>
                        <option value="pending">待审核</option>
                        <option value="approved">已通过</option>
                        <option value="rejected">已拒绝</option>
                      </select>
                      <Button size="sm" variant="outline" onClick={() => void load("withdraw")}>筛选</Button>
                    </div>
                  </div>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>用户 ID</TableHead><TableHead>金额</TableHead>
                          <TableHead>渠道</TableHead><TableHead>状态</TableHead>
                          <TableHead>申请时间</TableHead><TableHead>审核备注</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!(data.rows?.length) ? (
                          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">暂无提现申请</TableCell></TableRow>
                        ) : data.rows.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{String(r.user_id || "").slice(0, 14)}…</TableCell>
                            <TableCell className="font-semibold text-emerald-600">¥{fmt(r.amount)}</TableCell>
                            <TableCell className="text-xs">{r.channel || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "outline"} className="text-xs">
                                {r.status === "approved" ? "已通过" : r.status === "rejected" ? "已拒绝" : "待审核"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDt(r.created_at)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{r.review_note || "-"}</TableCell>
                            <TableCell className="text-right">
                              {r.status === "pending" && (
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200"
                                    onClick={() => handleReview(r.id, "approve")}>通过</Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200"
                                    onClick={() => { const note = prompt("拒绝原因（可选）") ?? ""; handleReview(r.id, "reject", note) }}>拒绝</Button>
                                </div>
                              )}
                              {r.status !== "pending" && <span className="text-xs text-muted-foreground">已处理</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-xl text-sm z-50">{toast}</div>
      )}

      {/* 发放折扣码弹窗 */}
      {discountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setDiscountModal(null) }}>
          <Card className="w-full max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Gift size={16} className="text-emerald-500" />发放折扣码</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setDiscountModal(null)}><X size={16} /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-muted-foreground">
                发放给邀请人：<span className="font-mono font-semibold text-slate-700">{discountModal.inviterUserId.slice(0, 16)}…</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">折扣比例（如 0.8 = 八折，0.9 = 九折）</Label>
                <Input value={discountForm.discount} onChange={e => setDiscountForm(p => ({...p, discount: e.target.value}))}
                  placeholder="0.8" className="h-9" />
                <p className="text-xs text-muted-foreground">
                  {(() => { const d = parseFloat(discountForm.discount); return !isNaN(d) && d > 0 && d < 1 ? `用户充值时可享受 ${Math.round((1-d)*100)}% 折扣` : "" })()}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">可使用次数</Label>
                <Input value={discountForm.maxUses} onChange={e => setDiscountForm(p => ({...p, maxUses: e.target.value}))}
                  placeholder="1" type="number" min="1" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">过期时间（可选）</Label>
                <Input value={discountForm.expiresAt} onChange={e => setDiscountForm(p => ({...p, expiresAt: e.target.value}))}
                  type="datetime-local" className="h-9" />
              </div>
            </CardContent>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDiscountModal(null)}>取消</Button>
              <Button size="sm" onClick={handleIssueDiscount} className="bg-emerald-600 hover:bg-emerald-700">
                <Gift size={13} className="mr-1" />确认发放
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
