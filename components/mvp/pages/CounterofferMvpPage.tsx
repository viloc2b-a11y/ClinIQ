"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { MVP_MOCK, formatUsd, type MvpCounterofferLine } from "@/lib/mvp/mock"

function priorityBadge(priority: MvpCounterofferLine["priority"]) {
  if (priority === "must-win") return <Badge variant="destructive">must-win</Badge>
  return <Badge variant="secondary">tradeoff</Badge>
}

export function CounterofferMvpPage() {
  const sponsorOffer = 180_000
  const internalTarget = 240_000
  const gap = internalTarget - sponsorOffer

  const rows = useMemo(() => {
    const maxDays = Math.max(...MVP_MOCK.patients.map((p) => p.days))
    return MVP_MOCK.counteroffer
      .map((r) => ({
        ...r,
        delta: r.proposed - r.sponsor,
        daysPending: maxDays,
        justification:
          r.priority === "must-win"
            ? "Direct revenue leakage risk; aligns to expected billables"
            : "Negotiation tradeoff to close faster",
      }))
      .sort((a, b) => b.daysPending - a.daysPending)
  }, [])

  return (
    <MvpShell title="Counteroffer">
      <StudyHeader study="STUDY-1" timeWindow="Last 30 days" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Sponsor Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">{formatUsd(sponsorOffer)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Internal Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">{formatUsd(internalTarget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Gap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-destructive">{formatUsd(gap)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Counteroffer Lines</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="default" disabled>
                Auto Generate
              </Button>
              <Button size="sm" variant="outline" disabled>
                Export PDF
              </Button>
              <Button size="sm" variant="outline" disabled>
                Copy Email
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee</TableHead>
                <TableHead>Sponsor</TableHead>
                <TableHead>Proposed</TableHead>
                <TableHead>Δ</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Justification</TableHead>
                <TableHead>Days Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.fee}>
                  <TableCell className="font-medium">{r.fee}</TableCell>
                  <TableCell>{formatUsd(r.sponsor)}</TableCell>
                  <TableCell className="font-semibold">{formatUsd(r.proposed)}</TableCell>
                  <TableCell className="font-semibold">{formatUsd(r.delta)}</TableCell>
                  <TableCell>{priorityBadge(r.priority)}</TableCell>
                  <TableCell className="max-w-[420px] whitespace-normal text-muted-foreground">
                    {r.justification}
                  </TableCell>
                  <TableCell className="font-semibold">{r.daysPending}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MvpShell>
  )
}

