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
    note: "Demo data",
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

  return (
    <MvpShell
      title="Analytics"
      subtitle="Executive snapshot: revenue at risk, leakage, delayed and critical items — aligned to the active study."
    >
      {loading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <StudyHeader />
          {snapshot.source === "fallback" ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {snapshot.note ?? "Coordinated demo metrics — execution connection replaces with live totals."}
            </p>
          ) : null}
          <KpiCards kpis={snapshot.kpis} />

          <Card>
            <CardHeader className="pb-0">
              <div>
                <CardTitle>Executive metrics</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Recovery potential and aging in one view.</p>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>$ impact</TableHead>
                    <TableHead>Days pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.metric}>
                      <TableCell className="font-medium">{r.metric}</TableCell>
                      <TableCell>{r.value}</TableCell>
                      <TableCell className="font-semibold">{formatUsd(r.impactUsd)}</TableCell>
                      <TableCell className="font-semibold">{r.daysPending}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </MvpShell>
  )
}

