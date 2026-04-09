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
    <MvpShell
      title="Tasks"
      subtitle="Revenue recovery actions ranked by dollar exposure and aging — close these to protect billable revenue."
    >
      <StudyHeader />
      <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{demo.note}</p>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recovery actions</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Each row ties to dollars still exposed on the study.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled title="Assign owners when workflow is enabled">
                Assign owner
              </Button>
              <Button size="sm" variant="outline" disabled title="Complete tasks when workflow is enabled">
                Mark complete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Revenue at risk</TableHead>
                <TableHead>Aging</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="font-semibold">{formatUsd(t.amount)}</TableCell>
                  <TableCell className="font-semibold">{t.daysPending} days</TableCell>
                  <TableCell>
                    <span className="inline-flex flex-wrap items-center gap-1">
                      <Badge variant={t.priority === "critical" ? "destructive" : "secondary"} className="capitalize">
                        {t.priority}
                      </Badge>
                      {t.priority === "critical" ? (
                        <Badge variant="outline" className="text-[10px] font-normal text-destructive">
                          Recover now
                        </Badge>
                      ) : null}
                    </span>
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

