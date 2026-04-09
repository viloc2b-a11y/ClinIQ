"use client"

import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { getStudyBuildDemo } from "@/lib/mvp/backend"
import { formatUsd } from "@/lib/mvp/format"

type BuildRow = {
  area: string
  status: "ready" | "needs-review"
  daysPending: number
  impactUsd: number
}

export function StudyBuildMvpPage() {
  const demo = getStudyBuildDemo()
  const rows = useMemo<BuildRow[]>(() => {
    return demo.value
  }, [demo.value])

  return (
    <MvpShell title="Study Build">
      <StudyHeader />
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">Beta:</span> {demo.note}
      </div>

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

