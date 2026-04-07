"use client"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"
import Link from "next/link"

type AppTopNavProps = {
  /** Subtitle under the product name (e.g. marketing tour vs app shell). */
  tagline?: string
}

/**
 * Sticky top bar aligned with the marketing home (ClinIQPresentation) for interior pages.
 */
export function AppTopNav({ tagline = "Clinical finance & revenue" }: AppTopNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
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
        <nav
          className="flex max-w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2"
          aria-label="App navigation"
        >
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            Home
          </Link>
          <Link
            href="/dashboard?study_key=STUDY-1"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Workbench
          </Link>
          <Link href="/action-center" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Action Center
          </Link>
          <Link href="/budget-gap" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Budget gap
          </Link>
          <Link href="/negotiation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Negotiation
          </Link>
          <Link href="/import" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Import
          </Link>
          <Link href="/claims" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden md:inline-flex")}>
            Claims
          </Link>
          <Link href="/ledger" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden md:inline-flex")}>
            Ledger
          </Link>
          <Link href="/dashboard/ar" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden lg:inline-flex")}>
            AR
          </Link>
          <Link href="/#modules" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            Modules
          </Link>
          <Link href="/sales" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Tour
          </Link>
          <Link href="/admin" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
