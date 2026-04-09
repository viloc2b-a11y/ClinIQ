"use client"

import { useDemoContext } from "@/components/demo/DemoContext"
import { useEffect, useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KpiCards } from "@/components/mvp/KpiCards"
import { MvpPageSkeleton } from "@/components/mvp/MvpPageSkeleton"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { formatUsd } from "@/lib/mvp/format"
import { getAnalyticsSnapshot, type AnalyticsSnapshot } from "@/lib/mvp/backend"

type AnalyticsRow = {
  metric: string
  value: string
  daysPending: number
  impactUsd: number
}

export function AnalyticsMvpPage() {
  const { studyKey } = useDemoContext()
  const [loading, setLoading] = useState(true)
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot>({
    kpis: { ready: 0, atRisk: 0, delayed: 0, critical: 0 },
    metrics: [
      { metric: "Expected billables (next 30d)", value: formatUsd(0), daysPending: 12, impactUsd: 0 },
      { metric: "Revenue at risk", value: formatUsd(0), daysPending: 35, impactUsd: 0 },
      { metric: "Delayed items", value: "0", daysPending: 12, impactUsd: 0 },
      { metric: "Critical items", value: "0", daysPending: 35, impactUsd: 0 },
    ],
    source: "fallback",
    note: "Executive metrics reflect the active study until live execution syncs.",
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const s = await getAnalyticsSnapshot(studyKey)
      if (cancelled) return
      setSnapshot(s)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [studyKey])

  const rows = useMemo<AnalyticsRow[]>(() => snapshot.metrics, [snapshot.metrics])

  const executiveTakeaway = useMemo(() => {
    const { atRisk, critical } = snapshot.kpis
    if (atRisk <= 0 && critical <= 0) {
      return "As at-risk revenue and critical items accumulate, prioritize follow-up to protect billing windows and site margin."
    }
    if (critical > 0 && atRisk > 0) {
      return "Critical aging and at-risk revenue are concentrated enough to justify immediate operational follow-up."
    }
    if (atRisk > 0) {
      return `${formatUsd(atRisk)} is at risk in this window — address aging billables and leakage before exposure widens.`
    }
    return "Monitor critical items as execution updates — fast follow-up protects recoverable revenue."
  }, [snapshot.kpis])

  return (
    <MvpShell
      title="Analytics"
      subtitle="Executive view of recoverable revenue, aging pressure, and critical items requiring action."
    >
      {loading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <StudyHeader />
          {snapshot.source === "fallback" ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {snapshot.note ?? "Figures follow the active study; connect execution to refresh from site operations."}
            </p>
          ) : null}
          <KpiCards kpis={snapshot.kpis} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm leading-relaxed text-foreground">{executiveTakeaway}</p>
            {snapshot.kpis.critical > 0 ? (
              <span className="text-xs font-medium text-destructive whitespace-nowrap">Critical aging</span>
            ) : null}
          </div>

          <Card>
            <CardHeader className="pb-0">
              <div>
                <CardTitle>Executive metrics</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Recovery potential and aging in one view.</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-right">$ impact</TableHead>
                      <TableHead className="text-right">Days pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.metric}>
                        <TableCell className="min-w-[220px] font-medium">{r.metric}</TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">{r.value}</TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                          {formatUsd(r.impactUsd)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">{r.daysPending}d</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </MvpShell>
  )
}

