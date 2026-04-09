import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"

export default function AdminDeniedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Admin access denied</CardTitle>
          <CardDescription>
            You are signed in but your email is not listed in{" "}
            <code className="rounded bg-muted px-1 text-xs">CLINIQ_ADMIN_EMAILS</code>. Ask a deploy
            admin to add you.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <AdminSignOutButton />
          <Link
            href="/"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            Home
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
