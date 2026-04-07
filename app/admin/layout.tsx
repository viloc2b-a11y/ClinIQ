import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin — ClinIQ",
  description: "Administration and user invites",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/80 bg-card/50 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          <span className="text-sm font-semibold tracking-tight">ClinIQ · Admin</span>
        </div>
      </div>
      {children}
    </div>
  )
}
