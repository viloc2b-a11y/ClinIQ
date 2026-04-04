"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type ActionBarProps = {
  reviewed: boolean
  onMarkReviewed: () => void
  onCopySummary: () => void
  onExportJson: () => void
  copyDisabled?: boolean
  exportDisabled?: boolean
}

export function ActionBar({
  reviewed,
  onMarkReviewed,
  onCopySummary,
  onExportJson,
  copyDisabled,
  exportDisabled,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">Actions</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={copyDisabled}
        onClick={onCopySummary}
      >
        Copy Summary
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={exportDisabled}
        onClick={onExportJson}
      >
        Export JSON
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={onMarkReviewed}>
        Mark Reviewed
      </Button>
      {reviewed ? (
        <Badge variant="success">Reviewed</Badge>
      ) : (
        <Badge variant="outline">Not reviewed</Badge>
      )}
    </div>
  )
}
