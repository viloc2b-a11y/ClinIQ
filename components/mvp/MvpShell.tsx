"use client"

import { cn } from "@/lib/utils"

export function MvpShell({
  title,
  subtitle,
  children,
}: {
  title: string
  /** Executive one-liner for this screen (demo closure). */
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {subtitle ??
            "Sorted by highest delay · each row shows days pending and dollar impact · revenue at risk and recovery potential"}
        </p>
      </div>
      <div className={cn("mt-6", "flex flex-col gap-6")}>{children}</div>
    </div>
  )
}

