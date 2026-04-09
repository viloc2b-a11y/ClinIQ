"use client"

import { useDemoContext } from "@/components/demo/DemoContext"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StudyHeader({ timeWindow = "Last 30 days" }: { timeWindow?: string }) {
  const { studyKey, setStudyKey, studyOptions } = useDemoContext()

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Active study</span>
          {studyOptions.length > 1 ? (
            <select
              aria-label="Active study"
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
            <span className="rounded-md border border-border bg-background px-2 py-1 font-medium">{studyKey}</span>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{timeWindow}</span>
        </div>
        <p className="text-xs text-muted-foreground sm:max-w-xs sm:text-right">
          All demo views use this study so KPIs, leakage, billables, and negotiation stay one story.
        </p>
      </CardContent>
    </Card>
  )
}

