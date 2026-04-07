import { AdminLoginForm } from "@/components/admin/AdminLoginForm"
import { Suspense } from "react"

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-background px-4 py-12">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <AdminLoginForm />
      </Suspense>
    </main>
  )
}
