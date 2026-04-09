"use client"

import { useDemoContext } from "@/components/demo/DemoContext"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KpiCards } from "@/components/mvp/KpiCards"
import { MvpPageSkeleton } from "@/components/mvp/MvpPageSkeleton"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { formatUsd, statusFromDays } from "@/lib/mvp/format"
import { getExecutionSummary, getLeakageRows } from "@/lib/mvp/backend"

type LeakageRow = {
  patient: string
  visit: string
  amount: number
  daysPending: number
  status: "delayed" | "critical"
  cause: string
}

export function LeakageMvpPage() {
  const { studyKey } = useDemoContext()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<{ ready: number; atRisk: number; delayed: number; critical: number }>({
    ready: 0,
    atRisk: 0,
    delayed: 0,
    critical: 0,
  })
  const [rows, setRows] = useState<LeakageRow[]>([])
  const [sourceNote, setSourceNote] = useState<string | null>(null)

  const derived = useMemo(() => rows.sort((a, b) => b.daysPending - a.daysPending), [rows])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [summaryRes, leakageRes] = await Promise.all([getExecutionSummary(studyKey), getLeakageRows(studyKey)])
      if (cancelled) return
      setKpis(summaryRes.value)

      const mapped: LeakageRow[] = leakageRes.value.map((r) => ({
        patient: r.patient,
        visit: r.visit,
        amount: r.amount,
        daysPending: r.daysPending,
        status: statusFromDays(r.daysPending),
        cause: "Revenue exposure — unbilled or under-billed relative to expected execution",
      }))
      setRows(mapped)

      if (summaryRes.source === "live" || leakageRes.source === "live") setSourceNote(null)
      else setSourceNote(summaryRes.note ?? leakageRes.note ?? null)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [studyKey])

  return (
    <MvpShell
      title="Leakage"
      subtitle="Each signal here is revenue that may go unbilled or under-billed if not actioned — same study and window as Dashboard and Billables."
    >
      {loading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <StudyHeader />
          {sourceNote ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{sourceNote}</p>
          ) : null}
          <KpiCards kpis={kpis} />

          <Card>
            <CardHeader className="pb-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <CardTitle>Top leakage</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Ranked by days pending and dollar impact.</p>
                  <p className="mt-2 text-sm text-foreground">
                    Address highest-dollar, oldest items first to reduce revenue leakage fastest.
                  </p>
                </div>
                {derived.length > 0 ? (
                  <Badge variant="outline" className="w-fit shrink-0 whitespace-nowrap font-medium text-muted-foreground">
                    Recover now
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {derived.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No leakage rows for this cohort — sync execution or review Billables and Dashboard for the same study context.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Visit</TableHead>
                        <TableHead>Cause</TableHead>
                        <TableHead className="text-right">$ impact</TableHead>
                        <TableHead className="text-right">Days pending</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {derived.map((r) => {
                        const statusLabel = r.status === "critical" ? "Critical" : "Delayed"
                        return (
                          <TableRow key={`${r.patient}-${r.visit}`}>
                            <TableCell className="font-medium">{r.patient}</TableCell>
                            <TableCell className="whitespace-nowrap">{r.visit}</TableCell>
                            <TableCell className="min-w-[260px] whitespace-normal text-muted-foreground">{r.cause}</TableCell>
                            <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                              {formatUsd(r.amount)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                              {r.daysPending}d
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={r.status === "critical" ? "destructive" : "secondary"}
                                className="whitespace-nowrap font-medium"
                              >
                                {statusLabel}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </MvpShell>
  )
}

