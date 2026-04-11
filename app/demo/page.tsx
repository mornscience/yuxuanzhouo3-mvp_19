import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DemoPage() {
  const modules = [
    {
      title: "Growth Engine",
      description: "Build content matrix, schedule campaigns, and track channel performance in one place.",
    },
    {
      title: "Business Intelligence",
      description: "Get AI-generated strategy suggestions from revenue, cost, and market signals.",
    },
    {
      title: "Capital Connector",
      description: "Match with investors and grants based on stage, industry, and geography.",
    },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-5xl px-4 py-20 space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold">Product Demo</h1>
          <p className="text-muted-foreground">
            A quick walkthrough of the main capabilities. Replace module cards with your real screenshots or video embeds.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.title}>
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 rounded-md border border-dashed border-border/70 bg-muted/40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/launch">Start Building</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
