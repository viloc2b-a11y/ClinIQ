"use client"

import { useDemoContext } from "@/components/demo/DemoContext"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { KpiCards } from "@/components/mvp/KpiCards"
import { MvpPageSkeleton } from "@/components/mvp/MvpPageSkeleton"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { TopLeakageTable, type TopLeakageRow } from "@/components/mvp/TopLeakageTable"
import { formatUsd } from "@/lib/mvp/format"
import { getExecutionSummary, getLeakageRows } from "@/lib/mvp/backend"

export function DashboardMvpPage() {
  const { studyKey } = useDemoContext()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<{ ready: number; atRisk: number; delayed: number; critical: number }>({
    ready: 0,
    atRisk: 0,
    delayed: 0,
    critical: 0,
  })
  const [leakageRows, setLeakageRows] = useState<TopLeakageRow[]>([])
  const [sourceNote, setSourceNote] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const [summaryRes, leakageRes] = await Promise.all([getExecutionSummary(studyKey), getLeakageRows(studyKey)])
      if (cancelled) return

      setKpis(summaryRes.value)
      setLeakageRows(leakageRes.value.slice(0, 20))

      if (summaryRes.source === "live" || leakageRes.source === "live") {
        setSourceNote(null)
      } else {
        setSourceNote(summaryRes.note ?? leakageRes.note ?? null)
      }
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [studyKey])

  const executiveCallout = useMemo(() => {
    const { atRisk, delayed, critical } = kpis

    if (atRisk <= 0) {
      return <>No at-risk revenue surfaced for this study in the current billing window.</>
    }
    void delayed
    void critical

    return (
      <>
        <span className="font-semibold text-foreground">{formatUsd(atRisk)}</span> at risk across current execution
        signals — recoverable within the current billing window if actioned now.
      </>
    )
  }, [kpis, leakageRows])

  return (
    <MvpShell
      title="Dashboard"
      subtitle={
        loading ? (
          "Revenue concentration and recovery priority for the active study — same context across Billables, Leakage, and Counteroffer."
        ) : (
          <>
            <span className="font-medium text-foreground">{formatUsd(kpis.atRisk)}</span> at risk across current
            execution signals — prioritize recovery before billing windows close.
          </>
        )
      }
    >
      {loading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <StudyHeader />
          {sourceNote ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {sourceNote}
            </p>
          ) : null}

          <Card className="border-l-4 border-l-primary/80 bg-muted/20 shadow-none">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <p className="text-sm leading-relaxed text-foreground">{executiveCallout}</p>
              {kpis.critical > 0 ? (
                <Badge
                  variant="outline"
                  className="shrink-0 whitespace-nowrap border-destructive/40 font-medium text-destructive"
                >
                  Critical aging
                </Badge>
              ) : kpis.atRisk > 0 ? (
                <Badge variant="outline" className="shrink-0 whitespace-nowrap font-medium text-muted-foreground">
                  Recover now
                </Badge>
              ) : null}
            </CardContent>
          </Card>

          <KpiCards kpis={kpis} />
          <TopLeakageTable rows={leakageRows} />
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/billables" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
              Pending billables
            </Link>
            <Link href="/leakage" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
              Revenue leakage
            </Link>
            <Link href="/counteroffer" className={cn(buttonVariants({ variant: "default", size: "default" }))}>
              Negotiation opportunity
            </Link>
            <Link href="/analytics" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
              Executive analytics
            </Link>
          </div>
        </>
      )}
    </MvpShell>
  )
}

