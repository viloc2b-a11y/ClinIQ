import { AppTopNav } from "@/components/layout/AppTopNav"

/**
 * Page shell: same gradient + sticky chrome as the public home hero stack.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-background">
      <AppTopNav />
      {children}
    </div>
  )
}
