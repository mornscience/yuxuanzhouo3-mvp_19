"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

export default function ConnectCapitalPage() {
  const [loading, setLoading] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-3xl px-4 py-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Connect Capital</CardTitle>
            <CardDescription>Submit your funding profile to start investor and grant matching.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const company = String(formData.get("company") ?? "")
                const contactEmail = String(formData.get("contactEmail") ?? "")
                const raiseAmount = String(formData.get("raiseAmount") ?? "")
                const timeline = String(formData.get("timeline") ?? "")
                const story = String(formData.get("story") ?? "")

                if (!company || !contactEmail || !raiseAmount || !timeline || !story) {
                  toast({ title: "Missing fields", description: "Please complete all form fields.", variant: "destructive" })
                  return
                }

                try {
                  setLoading(true)
                  const res = await fetch("/api/connect-capital", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ company, contactEmail, raiseAmount, timeline, story }),
                  })
                  const data = (await res.json()) as { message?: string }

                  if (!res.ok) {
                    throw new Error(data.message ?? "Submit failed.")
                  }

                  toast({ title: "Submitted", description: data.message ?? "Profile submitted successfully." })
                  e.currentTarget.reset()
                } catch (error) {
                  toast({
                    title: "Request failed",
                    description: error instanceof Error ? error.message : "Unexpected error.",
                    variant: "destructive",
                  })
                } finally {
                  setLoading(false)
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" placeholder="Company name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input id="contactEmail" name="contactEmail" type="email" placeholder="founder@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="raiseAmount">Target raise</Label>
                <Input id="raiseAmount" name="raiseAmount" placeholder="USD 500,000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Input id="timeline" name="timeline" placeholder="Close within 3 months" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="story">Investment story</Label>
                <Textarea id="story" name="story" placeholder="Traction, market, product edge, and planned use of funds." required />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Profile"}
                </Button>
                <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
                  Back to home
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
