"use client"

import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KpiCards } from "@/components/mvp/KpiCards"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { MVP_MOCK, formatUsd } from "@/lib/mvp/mock"

type AnalyticsRow = {
  metric: string
  value: string
  daysPending: number
  impactUsd: number
}

export function AnalyticsMvpPage() {
  const rows = useMemo<AnalyticsRow[]>(() => {
    const maxDays = Math.max(...MVP_MOCK.patients.map((p) => p.days))
    return [
      { metric: "Expected billables (next 30d)", value: formatUsd(MVP_MOCK.kpis.ready), daysPending: maxDays, impactUsd: MVP_MOCK.kpis.ready },
      { metric: "Revenue at risk", value: formatUsd(MVP_MOCK.kpis.atRisk), daysPending: maxDays, impactUsd: MVP_MOCK.kpis.atRisk },
      { metric: "Delayed items", value: String(MVP_MOCK.kpis.delayed), daysPending: 12, impactUsd: MVP_MOCK.kpis.atRisk },
      { metric: "Critical items", value: String(MVP_MOCK.kpis.critical), daysPending: 35, impactUsd: MVP_MOCK.kpis.atRisk },
    ].sort((a, b) => b.daysPending - a.daysPending)
  }, [])

  return (
    <MvpShell title="Analytics">
      <StudyHeader study="STUDY-1" timeWindow="Last 30 days" />
      <KpiCards kpis={MVP_MOCK.kpis} />

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Executive analytics (demo)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>$ Impact</TableHead>
                <TableHead>Days Pending</TableHead>
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
    </MvpShell>
  )
}

