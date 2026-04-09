"use client"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type AppTopNavProps = {
  /** Subtitle under the product name (e.g. marketing tour vs app shell). */
  tagline?: string
}

const PRIMARY = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/billables", label: "Billables" },
  { href: "/leakage", label: "Leakage" },
  { href: "/counteroffer", label: "Counteroffer" },
  { href: "/analytics", label: "Analytics" },
] as const

const SECONDARY = [
  { href: "/", label: "Home" },
  { href: "/documents", label: "Documents" },
  { href: "/study-build", label: "Study Build" },
  { href: "/tasks", label: "Tasks" },
  { href: "/admin", label: "Admin" },
] as const

/**
 * Sticky top bar aligned with the marketing home (ClinIQPresentation) for interior pages.
 */
export function AppTopNav({ tagline = "Clinical finance & revenue" }: AppTopNavProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold tracking-tight">ClinIQ Financial</p>
            <p className="text-xs text-muted-foreground">{tagline}</p>
          </div>
        </Link>
        <div className="flex max-w-full flex-col items-end gap-2">
          <nav className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2" aria-label="Primary navigation">
            {PRIMARY.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    buttonVariants({ variant: active ? "default" : "outline", size: "sm" }),
                    "whitespace-nowrap",
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
          <nav
            className="flex max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-muted-foreground"
            aria-label="Additional workspace sections"
          >
            <span className="font-medium text-foreground/60">More</span>
            {SECONDARY.map(({ href, label }) => (
              <Link key={href} href={href} className="underline-offset-4 hover:text-foreground hover:underline">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
