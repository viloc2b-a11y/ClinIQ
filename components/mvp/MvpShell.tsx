"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function MvpShell({
  title,
  subtitle,
  children,
}: {
  title: string
  /** Executive one-liner: financial “why this matters” for this screen. */
  subtitle?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {subtitle ??
            "Ranked by aging where applicable — each row ties days outstanding to dollar impact and recovery priority."}
        </p>
      </div>
      <div className={cn("mt-7", "flex flex-col gap-6 sm:gap-7")}>{children}</div>
    </div>
  )
}

