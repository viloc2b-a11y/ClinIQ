import { AdminInviteForm } from "@/components/admin/AdminInviteForm"
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createServerSupabaseClient } from "@/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AdminHomePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect("/admin/login")
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Signed in as <span className="font-mono text-foreground">{user.email}</span>. Invite teammates and review
            deployment settings below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminSignOutButton />
          <Link
            href="/dashboard"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            Open workbench
          </Link>
        </div>
      </div>

      <AdminInviteForm />

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Environment</CardTitle>
          <CardDescription>
            Reference variables for your deployment. Do not share secret values outside secure channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            <code className="rounded bg-muted px-1 text-xs">CLINIQ_ADMIN_EMAILS</code> — comma-separated
            emails allowed to access <code className="text-xs">/admin</code> and send invites.
          </p>
          <p>
            <code className="rounded bg-muted px-1 text-xs">CLINIQ_PUBLIC_APP_URL</code> — public app
            URL (e.g. https://app.cliniqcloud.com) for invitation links.
          </p>
          <p>
            <code className="rounded bg-muted px-1 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> — server
            only; required for <code className="text-xs">inviteUserByEmail</code>.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
