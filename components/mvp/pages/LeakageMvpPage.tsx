"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KpiCards } from "@/components/mvp/KpiCards"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { MVP_MOCK, formatUsd, statusFromDays } from "@/lib/mvp/mock"

type LeakageRow = {
  patient: string
  visit: string
  amount: number
  daysPending: number
  status: "delayed" | "critical"
  cause: string
}

export function LeakageMvpPage() {
  const rows = useMemo<LeakageRow[]>(() => {
    return MVP_MOCK.patients
      .map((p) => ({
        patient: p.id,
        visit: p.visit,
        amount: p.amount,
        daysPending: p.days,
        status: statusFromDays(p.days),
        cause: p.event === "visit_completed" ? "Not billed yet" : "Missing billing trigger",
      }))
      .sort((a, b) => b.daysPending - a.daysPending)
  }, [])

  return (
    <MvpShell title="Leakage">
      <StudyHeader study="STUDY-1" timeWindow="Last 30 days" />
      <KpiCards kpis={MVP_MOCK.kpis} />

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Top Leakage (by days pending)</CardTitle>
            <Button size="sm" disabled>
              Create Tasks
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Visit</TableHead>
                <TableHead>Cause</TableHead>
                <TableHead>$ Impact</TableHead>
                <TableHead>Days Pending</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
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
        </CardContent>
      </Card>
    </MvpShell>
  )
}

