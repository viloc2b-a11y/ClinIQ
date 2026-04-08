"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function StudyHeader({
  study,
  timeWindow,
}: {
  study: string
  timeWindow: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Study</span>
          <span className="rounded-md border border-border bg-background px-2 py-1">{study}</span>
          <span className="text-muted-foreground">|</span>
          <span className="font-medium">Time window</span>
          <span className="rounded-md border border-border bg-background px-2 py-1">{timeWindow}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled>
            Change study
          </Button>
          <Button variant="outline" size="sm" disabled>
            Change window
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

