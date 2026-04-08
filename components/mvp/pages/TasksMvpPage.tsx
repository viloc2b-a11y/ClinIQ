"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { MVP_MOCK, formatUsd, statusFromDays } from "@/lib/mvp/mock"

type TaskRow = {
  id: string
  title: string
  amount: number
  daysPending: number
  priority: "delayed" | "critical"
  status: "open" | "in-progress" | "done"
}

export function TasksMvpPage() {
  const rows = useMemo<TaskRow[]>(() => {
    return MVP_MOCK.patients
      .map((p) => {
        const pr = statusFromDays(p.days)
        return {
          id: `TASK-${p.id}-${p.visit}`,
          title: `Resolve billing delay: ${p.id} ${p.visit}`,
          amount: p.amount,
          daysPending: p.days,
          priority: pr,
          status: "open",
        } as const
      })
      .sort((a, b) => b.daysPending - a.daysPending)
  }, [])

  return (
    <MvpShell title="Tasks">
      <StudyHeader study="STUDY-1" timeWindow="Last 30 days" />

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Action Queue</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled>
                Assign
              </Button>
              <Button size="sm" variant="outline" disabled>
                Mark done
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>$ Impact</TableHead>
                <TableHead>Days Pending</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="font-semibold">{formatUsd(t.amount)}</TableCell>
                  <TableCell className="font-semibold">{t.daysPending}</TableCell>
                  <TableCell>
                    <Badge variant={t.priority === "critical" ? "destructive" : "secondary"}>{t.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.status}</Badge>
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

