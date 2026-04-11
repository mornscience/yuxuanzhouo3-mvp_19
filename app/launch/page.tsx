"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

export default function LaunchPage() {
  const [loading, setLoading] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-3xl px-4 py-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Launch Project</CardTitle>
            <CardDescription>Share your project basics and we can route you to the right onboarding flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const projectName = String(formData.get("projectName") ?? "")
                const website = String(formData.get("website") ?? "")
                const stage = String(formData.get("stage") ?? "")
                const goal = String(formData.get("goal") ?? "")

                if (!projectName || !stage || !goal) {
                  toast({
                    title: "Missing fields",
                    description: "Please complete project name, stage, and 90-day goal.",
                    variant: "destructive",
                  })
                  return
                }

                try {
                  setLoading(true)
                  const res = await fetch("/api/launch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ projectName, website, stage, goal }),
                  })
                  const data = (await res.json()) as { message?: string }

                  if (!res.ok) {
                    throw new Error(data.message ?? "Submit failed.")
                  }

                  toast({ title: "Submitted", description: data.message ?? "Launch request submitted successfully." })
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
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="projectName">Project name</Label>
                <Input id="projectName" name="projectName" placeholder="mornbusiness AI Suite" required />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" type="url" placeholder="https://example.com" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stage">Current stage</Label>
                <Input id="stage" name="stage" placeholder="Idea / MVP / Revenue / Scale" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="goal">90-day goal</Label>
                <Textarea id="goal" name="goal" placeholder="Describe what you want to achieve in the next 90 days." required />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Launch Request"}
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
