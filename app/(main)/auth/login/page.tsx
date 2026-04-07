import { CoordinatorLoginForm } from "@/components/auth/CoordinatorLoginForm"
import { Suspense } from "react"

export default function AuthLoginPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <CoordinatorLoginForm />
      </Suspense>
    </main>
  )
}
