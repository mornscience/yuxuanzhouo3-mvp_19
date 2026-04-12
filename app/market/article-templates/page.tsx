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
      else setError(json.message || "Failed to load")
    } catch { setError("Failed to load templates") }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Please enter a template title"); return }
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
      } else setError(json.message || "Failed to save")
    } catch { setError("Failed to save") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return
    try {
      const res = await fetch("/api/market/article-templates", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id })
      })
      const json = await res.json()
      if (json.ok) await loadTemplates()
      else setError(json.message || "Failed to delete")
    } catch { setError("Failed to delete") }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Article Templates</h1>
      {error && <Alert variant="destructive" className="mb-4"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card className="mb-8">
        <CardHeader><CardTitle>{editId ? "Edit Template" : "New Template"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Enter template title" /></div>
          <div><Label>Content</Label><textarea className="w-full border rounded p-2 text-sm h-32" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Enter template content" /></div>
          <div><Label>Image URLs (comma-separated)</Label><Input value={form.images} onChange={e => setForm({...form, images: e.target.value})} placeholder="https://..." /></div>
          <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="tag1,tag2" /></div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
            {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ title: "", content: "", images: "", tags: "" }) }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Title</TableHead><TableHead>Tags</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:3}).map((_,i) => (
              <TableRow key={i}>{Array.from({length:4}).map((_,j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
            )) : templates.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">No article templates yet</TableCell></TableRow>
            ) : templates.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.tags}</TableCell>
                <TableCell>{(t.created_at || t.createdAt)?.slice(0,10)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditId(t.id); setForm({ title: t.title, content: t.content, images: t.images || "", tags: t.tags || "" }) }}>Edit</Button>
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
