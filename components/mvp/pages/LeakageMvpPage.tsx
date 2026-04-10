"use client"

import { useDemoContext } from "@/components/demo/DemoContext"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KpiCards } from "@/components/mvp/KpiCards"
import { MvpPageSkeleton } from "@/components/mvp/MvpPageSkeleton"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { formatUsd, statusFromDays } from "@/lib/mvp/format"
import { getExecutionSummary, getLeakageRows } from "@/lib/mvp/backend"
import { cn } from "@/lib/utils"

type LeakageRow = {
  patient: string
  visit: string
  amount: number
  daysPending: number
  status: "delayed" | "critical"
  cause: string
}

export function LeakageMvpPage() {
  const { isDemoMode, studyKey, enterDemoMode } = useDemoContext()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<{ ready: number; atRisk: number; delayed: number; critical: number }>({
    ready: 0,
    atRisk: 0,
    delayed: 0,
    critical: 0,
  })
  const [rows, setRows] = useState<LeakageRow[]>([])
  const [sourceNote, setSourceNote] = useState<string | null>("Demo data")
  const [sourceError, setSourceError] = useState<string | null>(null)

  const derived = useMemo(() => rows.sort((a, b) => b.daysPending - a.daysPending), [rows])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [summaryRes, leakageRes] = await Promise.all([
        getExecutionSummary(studyKey, { demoMode: isDemoMode }),
        getLeakageRows(studyKey, { demoMode: isDemoMode }),
      ])
      if (cancelled) return
      setKpis(summaryRes.value)

      const mapped: LeakageRow[] = leakageRes.value.map((r) => ({
        patient: r.patient,
        visit: r.visit,
        amount: r.amount,
        daysPending: r.daysPending,
        status: statusFromDays(r.daysPending),
        cause: "Missing or under-billed revenue from execution leakage signals",
      }))
      setRows(mapped)

      if (summaryRes.source === "error" || leakageRes.source === "error") {
        setSourceError(summaryRes.error ?? leakageRes.error ?? "Could not load leakage data.")
        setSourceNote(null)
      } else {
        setSourceError(null)
        if (summaryRes.source === "live" || leakageRes.source === "live") setSourceNote(null)
        else setSourceNote(summaryRes.note ?? leakageRes.note ?? "Coordinated demo leakage — connect execution for live rows.")
      }
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
      subtitle="Revenue leakage and recovery opportunity — same study and time window as Dashboard and Billables."
    >
      {loading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <StudyHeader />
          {!studyKey.trim() && !isDemoMode ? (
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No study selected.</p>
              <p className="mt-1">Leakage monitoring is downstream. Run a demo to preview, or start from Negotiations.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={enterDemoMode} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                  Run demo
                </button>
              </div>
            </div>
          ) : null}
          {sourceError ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">{sourceError}</p>
          ) : null}
          {sourceNote ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{sourceNote}</p>
          ) : null}
          <KpiCards kpis={kpis} />

          <Card>
            <CardHeader className="pb-0">
              <div>
                <CardTitle>Top leakage</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Ranked by days pending and dollar impact.</p>
              </div>
            </CardHeader>
            <CardContent>
              {derived.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No leakage rows for this study — connect execution data or use the coordinated demo on other pages.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Visit</TableHead>
                      <TableHead>Cause</TableHead>
                      <TableHead>$ impact</TableHead>
                      <TableHead>Days pending</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {derived.map((r) => (
                      <TableRow key={`${r.patient}-${r.visit}`}>
                        <TableCell className="font-medium">{r.patient}</TableCell>
                        <TableCell>{r.visit}</TableCell>
                        <TableCell className="text-muted-foreground">{r.cause}</TableCell>
                        <TableCell className="font-semibold">{formatUsd(r.amount)}</TableCell>
                        <TableCell className="font-semibold">{r.daysPending}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "critical" ? "destructive" : "secondary"}>{r.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </MvpShell>
  )
}

