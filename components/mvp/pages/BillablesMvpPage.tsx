"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { MVP_MOCK, formatUsd, statusFromDays, type MvpPatient } from "@/lib/mvp/mock"

type Filter = "all" | "delayed" | "critical"

function billableStatus(p: MvpPatient): "pending" | "ready" | "billed" {
  return p.status === "ready" ? "ready" : "pending"
}

export function BillablesMvpPage() {
  const [filter, setFilter] = useState<Filter>("all")

  const rows = useMemo(() => {
    const sorted = [...MVP_MOCK.patients].sort((a, b) => b.days - a.days)
    const filtered = sorted.filter((p) => {
      if (filter === "all") return true
      const sev = statusFromDays(p.days)
      return sev === filter
    })
    return filtered
  }, [filter])

  return (
    <MvpShell title="Billables">
      <StudyHeader study="STUDY-1" timeWindow="Last 30 days" />

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Expected Billables</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
                All
              </Button>
              <Button
                size="sm"
                variant={filter === "delayed" ? "default" : "outline"}
                onClick={() => setFilter("delayed")}
              >
                Delayed (&gt;7)
              </Button>
              <Button
                size="sm"
                variant={filter === "critical" ? "default" : "outline"}
                onClick={() => setFilter("critical")}
              >
                Critical (&gt;30)
              </Button>
              <Button size="sm" variant="outline" disabled>
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Visit</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Pending</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const sev = statusFromDays(p.days)
                const st = billableStatus(p)
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.id}</TableCell>
                    <TableCell>{p.visit}</TableCell>
                    <TableCell className="text-muted-foreground">{p.event}</TableCell>
                    <TableCell className="font-semibold">{formatUsd(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={st === "ready" ? "secondary" : "outline"}>{st}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {p.days}{" "}
                      <span className={sev === "critical" ? "text-destructive" : "text-amber-600"}>🔥</span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" disabled>
                        Mark Ready
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MvpShell>
  )
}

