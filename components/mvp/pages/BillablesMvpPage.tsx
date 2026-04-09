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

type Filter = "all" | "delayed" | "critical"

function billableStatusLabel(status: BillablesRow["status"]) {
  switch (status) {
    case "ready":
      return "Ready"
    case "pending":
      return "Pending"
    default:
      return status
  }
}

export function BillablesMvpPage() {
  const { studyKey } = useDemoContext()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [source, setSource] = useState<DataSource>("fallback")
  const [rows, setRows] = useState<BillablesRow[]>(
    [],
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const res = await getBillablesRows(studyKey)
      if (cancelled) return
      setSource(res.source)
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

  const billablesRecoverySummary = useMemo(() => {
    const pending = rows.filter((r) => r.status === "pending")
    const count = pending.length
    const total = pending.reduce((s, r) => s + r.amount, 0)
    const criticalN = pending.filter((r) => statusFromDays(r.daysPending) === "critical").length

    if (count === 0) {
      return "No pending billable items in this view."
    }

    const totalStr = formatUsd(total)
    const itemWord = count === 1 ? "item" : "items"
    const criticalClause =
      criticalN === 0
        ? "with none critically aged in this view"
        : criticalN === 1
          ? "with 1 critically aged item requiring immediate action"
          : `with ${criticalN} critically aged items requiring immediate action`

    return `${count} pending ${itemWord} totaling ${totalStr}, ${criticalClause}.`
  }, [rows])

  return (
    <MvpShell
      title="Billables"
      subtitle="Pending billables ranked by aging so teams can recover revenue before write-off risk increases."
    >
      {loading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <StudyHeader />
          {source === "fallback" ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Active study view — rows align to live execution leakage when your feed is connected.
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
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed text-foreground">{billablesRecoverySummary}</p>
                {rows.some((r) => r.status === "pending" && statusFromDays(r.daysPending) === "critical") ? (
                  <Badge
                    variant="outline"
                    className="w-fit shrink-0 whitespace-nowrap border-destructive/40 font-medium text-destructive"
                  >
                    Recover now
                  </Badge>
                ) : null}
              </div>
              {visible.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No rows match this filter — widen to &quot;All&quot; or sync execution to populate this view.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Visit</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aging</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((p) => {
                        const sev = statusFromDays(p.daysPending)
                        const sevLabel = sev === "critical" ? "Critical" : "Delayed"
                        const stLabel = billableStatusLabel(p.status)
                        return (
                          <TableRow key={`${p.patient}-${p.visit}-${p.event}`}>
                            <TableCell className="font-medium">{p.patient}</TableCell>
                            <TableCell className="whitespace-nowrap">{p.visit}</TableCell>
                            <TableCell className="min-w-[220px] whitespace-normal text-muted-foreground">
                              {p.event}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                              {formatUsd(p.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={p.status === "ready" ? "secondary" : "outline"}
                                className="whitespace-nowrap font-medium"
                              >
                                {stLabel}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right tabular-nums">
                              <span
                                className={
                                  sev === "critical"
                                    ? "font-semibold text-destructive"
                                    : sev === "delayed"
                                      ? "font-semibold text-amber-800 dark:text-amber-300"
                                      : "font-semibold"
                                }
                              >
                                {p.daysPending}d
                              </span>
                              <span className="text-muted-foreground"> · </span>
                              <span className="text-sm text-muted-foreground">{sevLabel}</span>
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

