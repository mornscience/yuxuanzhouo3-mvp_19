import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { readSubmissions } from "@/lib/submissions-store"

export const dynamic = "force-dynamic"

export default async function SubmissionsAdminPage() {
  const submissions = await readSubmissions()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-5xl px-4 py-16 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Submissions</h1>
            <p className="text-muted-foreground">Saved records from login, launch, and connect-capital forms.</p>
          </div>
          <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
            Back to home
          </Link>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No submissions yet</CardTitle>
              <CardDescription>Submit any form first, then refresh this page.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((item) => (
              <Card key={item.id}>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg">{item.type}</CardTitle>
                  <CardDescription>{new Date(item.createdAt).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(item.data, null, 2)}</pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
