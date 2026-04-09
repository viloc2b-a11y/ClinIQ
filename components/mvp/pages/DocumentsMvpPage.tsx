"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { getDocumentsDemo } from "@/lib/mvp/backend"
import { formatUsd } from "@/lib/mvp/format"

type DocStatus = "processing" | "ready" | "error"

type DocRow = {
  name: string
  type: string
  status: DocStatus
  confidence: number
  daysPending: number
  impactUsd: number
}

function statusBadge(status: DocStatus) {
  if (status === "ready") return <Badge variant="secondary">ready</Badge>
  if (status === "processing") return <Badge variant="outline">processing</Badge>
  return <Badge variant="destructive">error</Badge>
}

export function DocumentsMvpPage() {
  const demo = getDocumentsDemo()
  const [uploads, setUploads] = useState<DocRow[]>(
    demo.value.map((d) => ({
      name: d.file,
      type: d.type,
      status: d.status,
      confidence: d.confidence,
      daysPending: d.daysPending,
      impactUsd: d.impactUsd,
    })),
  )

  const quickExtract = useMemo(() => {
    const byVisit = new Map<string, { visit: string; procedure: string; rate: number; days: number }>()
    // Quick extract: derive from intake rows, sorted by delay.
    for (const row of uploads) {
      const existing = byVisit.get(row.type)
      if (!existing || row.daysPending > existing.days) {
        byVisit.set(row.type, { visit: row.type, procedure: "Extracted row", rate: row.impactUsd, days: row.daysPending })
      }
    }
    return [...byVisit.values()].sort((a, b) => b.days - a.days)
  }, [uploads])

  function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    const maxDays = Math.max(0, ...uploads.map((u) => u.daysPending))
    const nowRows: DocRow[] = Array.from(files).map((f) => ({
      name: f.name,
      type: "uploaded",
      status: "processing",
      confidence: 0.75,
      daysPending: maxDays,
      impactUsd: uploads[0]?.impactUsd ?? 0,
    }))
    setUploads((prev) => [...nowRows, ...prev].sort((a, b) => b.daysPending - a.daysPending))
  }

  return (
    <MvpShell
      title="Documents"
      subtitle="Source documents and extracted rows that influence downstream revenue readiness."
    >
      <StudyHeader />
      <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{demo.note}</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-0">
            <CardTitle>Upload</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
              <div className="text-sm font-medium">Drag & drop</div>
              <div className="mt-1 text-xs text-muted-foreground">or click to upload</div>
              <input
                className="hidden"
                type="file"
                multiple
                onChange={(e) => onFilesSelected(e.target.files)}
              />
            </label>
            <Button variant="outline" disabled title="Available when study model publishing is enabled">
              Publish to study model
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <CardTitle>Ingestion List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Days Pending</TableHead>
                  <TableHead>$ Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads
                  .slice()
                  .sort((a, b) => b.daysPending - a.daysPending)
                  .map((d) => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.type}</TableCell>
                      <TableCell>{statusBadge(d.status)}</TableCell>
                      <TableCell>{Math.round(d.confidence * 100)}%</TableCell>
                      <TableCell className="font-semibold">{d.daysPending}</TableCell>
                      <TableCell className="font-semibold">{formatUsd(d.impactUsd)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Quick Extract</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visit</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Days Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quickExtract.map((row) => (
                <TableRow key={row.visit}>
                  <TableCell className="font-medium">{row.visit}</TableCell>
                  <TableCell>{row.procedure}</TableCell>
                  <TableCell>{formatUsd(row.rate)}</TableCell>
                  <TableCell className="font-semibold">{row.days}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MvpShell>
  )
}

