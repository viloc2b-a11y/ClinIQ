"use client"

import { useDemoContext } from "@/components/demo/DemoContext"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function StudyHeader({ timeWindow = "Last 30 days" }: { timeWindow?: string }) {
  const { isDemoMode, studyKey, setStudyKey, studyOptions, enterDemoMode, exitDemoMode } = useDemoContext()

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Study</span>
          {studyOptions.length > 1 ? (
            <select
              aria-label="Study"
              className={cn(
                "h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              value={studyKey}
              onChange={(e) => setStudyKey(e.target.value)}
            >
              {studyOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          ) : (
            <span className="rounded-md border border-border bg-background px-2 py-1 font-medium">
              {studyKey?.trim() ? studyKey : "No study selected"}
            </span>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{timeWindow}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:justify-end">
          {isDemoMode ? (
            <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[11px] font-medium text-foreground/80">
              Demo mode
            </span>
          ) : null}
          {isDemoMode ? (
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
              onClick={exitDemoMode}
            >
              Exit demo
            </button>
          ) : (
            <>
              <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")} href="/import">
                Intake sponsor offer
              </Link>
              <button
                type="button"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "h-8")}
                onClick={enterDemoMode}
              >
                Run demo
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

