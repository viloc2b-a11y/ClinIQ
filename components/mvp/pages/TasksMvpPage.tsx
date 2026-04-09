"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { getTasksDemo } from "@/lib/mvp/backend"
import { formatUsd, statusFromDays } from "@/lib/mvp/format"

type TaskRow = {
  id: string
  title: string
  amount: number
  daysPending: number
  priority: "delayed" | "critical"
  status: "open" | "in-progress" | "done"
}

export function TasksMvpPage() {
  const demo = getTasksDemo()
  const rows = useMemo<TaskRow[]>(() => {
    return demo.value
      .map((t) => ({
        id: `TASK-${t.title}`,
        title: t.title,
        amount: t.amount,
        daysPending: t.daysPending,
        priority: statusFromDays(t.daysPending),
        status: t.status,
      }))
      .sort((a, b) => b.daysPending - a.daysPending)
  }, [demo.value])

  return (
    <MvpShell title="Tasks">
      <StudyHeader />
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">Beta:</span> {demo.note}
      </div>

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

