"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { MVP_MOCK, formatUsd } from "@/lib/mvp/mock"

type BuildRow = {
  area: string
  status: "ready" | "needs-review"
  daysPending: number
  impactUsd: number
}

export function StudyBuildMvpPage() {
  const rows = useMemo<BuildRow[]>(() => {
    const maxDays = Math.max(...MVP_MOCK.patients.map((p) => p.days))
    const base: BuildRow[] = [
      { area: "Document coverage", status: "needs-review", daysPending: maxDays, impactUsd: MVP_MOCK.kpis.atRisk },
      { area: "Rate rules", status: "needs-review", daysPending: 12, impactUsd: MVP_MOCK.kpis.ready },
      { area: "Event → billable mapping", status: "needs-review", daysPending: 35, impactUsd: MVP_MOCK.kpis.atRisk },
      { area: "Published model", status: "ready", daysPending: 5, impactUsd: MVP_MOCK.kpis.ready },
    ]
    return base.sort((a, b) => b.daysPending - a.daysPending)
  }, [])

  return (
    <MvpShell title="Study Build">
      <StudyHeader study="STUDY-1" timeWindow="Last 30 days" />

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Builder checklist</CardTitle>
            <Button size="sm" disabled>
              Approve & Publish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Pending</TableHead>
                <TableHead>$ Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.area}>
                  <TableCell className="font-medium">{r.area}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "ready" ? "secondary" : "outline"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{r.daysPending}</TableCell>
                  <TableCell className="font-semibold">{formatUsd(r.impactUsd)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MvpShell>
  )
}

