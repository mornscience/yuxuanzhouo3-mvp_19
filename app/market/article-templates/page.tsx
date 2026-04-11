"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

export default function ArticleTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", content: "", images: "", tags: "" })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/market/blogger-cooperation?type=articles", { credentials: "include" })
      const json = await res.json()
      if (json.ok) setTemplates(json.data || [])
      else setError(json.message || "加载失败")
    } catch { setError("加载模板失败") }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError("请输入模板标题"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/market/article-templates", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: editId ? "update" : "create", id: editId, ...form })
      })
      const json = await res.json()
      if (json.ok) {
        setEditId(null)
        setForm({ title: "", content: "", images: "", tags: "" })
        await loadTemplates()
      } else setError(json.message || "保存失败")
    } catch { setError("保存失败") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个模板吗？")) return
    try {
      const res = await fetch("/api/market/article-templates", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id })
      })
      const json = await res.json()
      if (json.ok) await loadTemplates()
      else setError(json.message || "删除失败")
    } catch { setError("删除失败") }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">文章模板管理</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="mb-8">
        <CardHeader><CardTitle>{editId ? "编辑模板" : "新建模板"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>模板标题</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="请输入模板标题" /></div>
          <div><Label>模板内容</Label><textarea className="w-full border rounded p-2 text-sm h-32" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="请输入模板内容" /></div>
          <div><Label>图片URL（逗号分隔）</Label><Input value={form.images} onChange={e => setForm({...form, images: e.target.value})} placeholder="https://..." /></div>
          <div><Label>标签（逗号分隔）</Label><Input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="标签1,标签2" /></div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : editId ? "更新" : "创建"}</Button>
            {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ title: "", content: "", images: "", tags: "" }) }}>取消</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>标题</TableHead><TableHead>标签</TableHead><TableHead>创建时间</TableHead><TableHead>操作</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:3}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:4}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : templates.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">暂无文章模板</TableCell></TableRow>
            ) : templates.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.tags}</TableCell>
                <TableCell>{(t.created_at || t.createdAt)?.slice(0,10)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditId(t.id); setForm({ title: t.title, content: t.content, images: t.images || "", tags: t.tags || "" }) }}>编辑</Button>
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