"use client"

import { useDemoContext } from "@/components/demo/DemoContext"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpPageSkeleton } from "@/components/mvp/MvpPageSkeleton"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { formatUsd } from "@/lib/mvp/format"
import { getCounterofferData, type CounterofferData, type DataSource } from "@/lib/mvp/backend"
import { cn } from "@/lib/utils"

function priorityBadge(priority: "must-win" | "tradeoff") {
  if (priority === "must-win") return <Badge variant="destructive">must-win</Badge>
  return <Badge variant="secondary">tradeoff</Badge>
}

export function CounterofferMvpPage() {
  const { studyKey, dealId, setDealId, deals, dealsLoading } = useDemoContext()
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<DataSource>("fallback")
  const [note, setNote] = useState<string | null>(null)
  const [data, setData] = useState<CounterofferData>({
    sponsorOffer: 180_000,
    internalTarget: 240_000,
    gap: 60_000,
    lines: [],
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const res = await getCounterofferData({ dealId, studyKey })
      if (cancelled) return
      setSource(res.source)
      setNote(res.source === "fallback" ? res.note ?? null : null)
      setData(res.value)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [dealId, studyKey])

  const rows = useMemo(() => [...data.lines].sort((a, b) => b.daysPending - a.daysPending), [data.lines])

  const dealSelectDisabled = dealsLoading || deals.length === 0

  return (
    <MvpShell
      title="Counteroffer"
      subtitle="Negotiation opportunity — sponsor versus target economics by fee line, using the same study context as the rest of the demo."
    >
      {loading || dealsLoading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <StudyHeader />
            <div className="flex flex-wrap justify-end gap-2">
              {source === "fallback" ? (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  Demo scenario
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-normal">
                  Live negotiation lines
                </Badge>
              )}
            </div>
          </div>

          {note ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{note}</p>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Active deal</CardTitle>
              <p className="text-xs text-muted-foreground">
                Open deals for this study load automatically. Pick a deal to drive counteroffer lines — no URL parameters
                required.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label className="text-sm font-medium shrink-0" htmlFor="demo-deal-select">
                Deal
              </label>
              <select
                id="demo-deal-select"
                className={cn(
                  "h-10 min-w-[240px] flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  dealSelectDisabled && "cursor-not-allowed opacity-60",
                )}
                disabled={dealSelectDisabled}
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
              >
                {deals.length === 0 ? (
                  <option value="">Coordinated demo deal (no database deals)</option>
                ) : (
                  deals.map((d) => (
                    <option key={d.deal_id} value={d.deal_id}>
                      {d.label}
                    </option>
                  ))
                )}
              </select>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Sponsor offer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">{formatUsd(data.sponsorOffer)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Internal target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight">{formatUsd(data.internalTarget)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Gap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight text-destructive">{formatUsd(data.gap)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Counteroffer lines</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Recovery potential by line — priority reflects upside vs. sponsor position.</p>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No lines to display.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee</TableHead>
                      <TableHead>Sponsor</TableHead>
                      <TableHead>Proposed</TableHead>
                      <TableHead>Δ</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Justification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={`${r.fee}-${i}`}>
                        <TableCell className="font-medium">{r.fee}</TableCell>
                        <TableCell>{formatUsd(r.sponsor)}</TableCell>
                        <TableCell className="font-semibold">{formatUsd(r.proposed)}</TableCell>
                        <TableCell className="font-semibold">{formatUsd(r.delta)}</TableCell>
                        <TableCell>{priorityBadge(r.priority)}</TableCell>
                        <TableCell className="max-w-[420px] whitespace-normal text-muted-foreground">{r.justification}</TableCell>
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
