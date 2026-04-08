"use client"

import { cn } from "@/lib/utils"

export function MvpShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Demo mode · sorted by highest delay · every row shows days pending + $ impact
        </p>
      </div>
      <div className={cn("mt-6", "flex flex-col gap-6")}>{children}</div>
    </div>
  )
}

