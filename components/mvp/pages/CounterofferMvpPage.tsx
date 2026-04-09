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
  if (priority === "must-win")
    return (
      <span className="flex flex-wrap items-center gap-1">
        <Badge variant="destructive" className="whitespace-nowrap font-medium">
          Must-win
        </Badge>
        <Badge variant="outline" className="whitespace-nowrap text-[10px] font-medium text-muted-foreground">
          Negotiation leverage
        </Badge>
      </span>
    )
  return (
    <Badge variant="secondary" className="whitespace-nowrap font-medium">
      Tradeoff
    </Badge>
  )
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

  const shellSubtitle =
    loading || dealsLoading ? (
      "Sponsor versus site-target economics by fee line — aligned to the same active study as Billables and Leakage."
    ) : (
      <>
        <span className="font-medium text-foreground">{formatUsd(data.gap)}</span> gap between sponsor offer and site
        target — protect margin before final budget acceptance.
      </>
    )

  return (
    <MvpShell title="Counteroffer" subtitle={shellSubtitle}>
      {loading || dealsLoading ? (
        <MvpPageSkeleton />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <StudyHeader />
            <div className="flex flex-wrap justify-end gap-2">
              {source === "fallback" ? (
                <Badge variant="outline" className="whitespace-nowrap font-medium text-muted-foreground">
                  Negotiation scenario
                </Badge>
              ) : (
                <Badge variant="secondary" className="whitespace-nowrap font-medium">
                  Saved negotiation lines
                </Badge>
              )}
            </div>
          </div>

          {note ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{note}</p>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Negotiation record</CardTitle>
              <p className="text-xs text-muted-foreground">
                Open deals for this study appear here when present; otherwise the workspace uses the current study
                scenario.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label className="text-sm font-medium shrink-0" htmlFor="deal-select">
                Deal
              </label>
              <select
                id="deal-select"
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
                  <option value="">Current study scenario</option>
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
                <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatUsd(data.sponsorOffer)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Internal target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatUsd(data.internalTarget)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Gap</CardTitle>
                <Badge variant="outline" className="whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                  Margin risk
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight tabular-nums text-destructive">
                  {formatUsd(data.gap)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 bg-muted/15 shadow-none">
            <CardContent className="space-y-2 p-4 text-sm leading-relaxed text-foreground">
              <p>This gap directly affects site margin and downstream study viability.</p>
              {rows.length > 0 ? (
                <p className="text-muted-foreground">
                  Prioritized lines focus on the highest recovery and negotiation leverage.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Counteroffer lines</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Recovery potential by line — priority reflects upside vs. sponsor position.</p>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No counteroffer lines in this view.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee</TableHead>
                        <TableHead className="text-right">Sponsor</TableHead>
                        <TableHead className="text-right">Proposed</TableHead>
                        <TableHead className="text-right">Δ</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Justification</TableHead>
                        <TableHead className="text-right">Days pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r, i) => (
                        <TableRow key={`${r.fee}-${i}`}>
                          <TableCell className="whitespace-nowrap font-medium">{r.fee}</TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">{formatUsd(r.sponsor)}</TableCell>
                          <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                            {formatUsd(r.proposed)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                            {formatUsd(r.delta)}
                          </TableCell>
                          <TableCell>{priorityBadge(r.priority)}</TableCell>
                          <TableCell className="min-w-[320px] max-w-[520px] whitespace-normal text-muted-foreground">
                            {r.justification}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                            {r.daysPending}d
                          </TableCell>
                        </TableRow>
                      ))}
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
