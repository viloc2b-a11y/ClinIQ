"use client"

import { useDemoContext } from "@/components/demo/DemoContext"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpPageSkeleton } from "@/components/mvp/MvpPageSkeleton"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { formatUsd, statusFromDays } from "@/lib/mvp/format"
import { getBillablesRows, type BillablesRow, type DataSource } from "@/lib/mvp/backend"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Filter = "all" | "delayed" | "critical"

export function BillablesMvpPage() {
  const { isDemoMode, studyKey, enterDemoMode } = useDemoContext()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [source, setSource] = useState<DataSource>("fallback")
  const [sourceError, setSourceError] = useState<string | null>(null)
  const [rows, setRows] = useState<BillablesRow[]>(
    [],
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const res = await getBillablesRows(studyKey, { demoMode: isDemoMode })
      if (cancelled) return
      setSource(res.source)
      setSourceError(res.source === "error" ? res.error ?? "Could not load billables." : null)
      setRows(res.value)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [studyKey])

  const visible = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.daysPending - a.daysPending)
    const filtered = sorted.filter((p) => {
      if (filter === "all") return true
      const sev = statusFromDays(p.daysPending)
      return sev === filter
    })
    return filtered
  }, [filter, rows])

  return (
    <MvpShell
      title="Billables"
      subtitle="Pending billables ranked by delay — each row ties dollars to days outstanding and recovery potential."
    >
      {loading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <StudyHeader />
          {!studyKey.trim() && !isDemoMode ? (
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No study selected.</p>
              <p className="mt-1">Execution is downstream. Start from Negotiations, or run a demo to preview billables.</p>
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
          {source === "fallback" ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Demo scenario — billables are simulated for walkthrough.
            </p>
          ) : null}

          <Card>
            <CardHeader className="pb-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Pending billables</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Filter by aging to focus revenue at risk.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === "delayed" ? "default" : "outline"}
                    onClick={() => setFilter("delayed")}
                  >
                    Delayed (&gt;7d)
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === "critical" ? "default" : "outline"}
                    onClick={() => setFilter("critical")}
                  >
                    Critical (&gt;30d)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {visible.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No rows match this filter — try &quot;All&quot; or connect execution data for live billables.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Visit</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Days pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((p) => {
                      const sev = statusFromDays(p.daysPending)
                      const st = p.status
                      return (
                        <TableRow key={`${p.patient}-${p.visit}-${p.event}`}>
                          <TableCell className="font-medium">{p.patient}</TableCell>
                          <TableCell>{p.visit}</TableCell>
                          <TableCell className="text-muted-foreground">{p.event}</TableCell>
                          <TableCell className="font-semibold">{formatUsd(p.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={st === "ready" ? "secondary" : "outline"}>{st}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            <span className={sev === "critical" ? "text-destructive" : sev === "delayed" ? "text-amber-700" : ""}>
                              {p.daysPending}
                            </span>
                            {sev === "critical" ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">critical aging</span>
                            ) : sev === "delayed" ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">delayed</span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      )
                    })}
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

