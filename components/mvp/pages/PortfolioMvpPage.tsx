"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MvpShell } from "@/components/mvp/MvpShell"
import { StudyHeader } from "@/components/mvp/StudyHeader"
import { cn } from "@/lib/utils"
import { formatUsd } from "@/lib/mvp/format"

type Phase = "draft" | "negotiating" | "active"

type PortfolioStudy = {
  study_key: string
  phase: Phase
  upside: number | null
  missing_revenue: number | null
  next_action: string
}

export function PortfolioMvpPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<PortfolioStudy[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setErr(null)
      try {
        const res = await fetch("/api/portfolio", { cache: "no-store" })
        const json = (await res.json()) as { ok?: unknown; error?: unknown; data?: any }
        if (!res.ok || json.ok !== true) {
          throw new Error(typeof json.error === "string" ? json.error : "Portfolio failed to load")
        }
        const studies = Array.isArray(json.data?.studies) ? (json.data.studies as any[]) : []
        const mapped: PortfolioStudy[] = studies.map((s) => ({
          study_key: String(s.study_key ?? "—"),
          phase: (String(s.phase ?? "draft") as Phase) ?? "draft",
          upside: s.upside == null ? null : (Number(s.upside) || 0),
          missing_revenue: s.missing_revenue == null ? null : (Number(s.missing_revenue) || 0),
          next_action: String(s.next_action ?? "Review study"),
        }))
        if (!cancelled) setRows(mapped)
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const headline = useMemo(() => {
    const negotiating = rows.filter((r) => r.phase === "negotiating").length
    const active = rows.filter((r) => r.phase === "active").length
    const missing = rows.reduce((s, r) => s + (r.missing_revenue ?? 0), 0)
    return { negotiating, active, missing }
  }, [rows])

  return (
    <MvpShell
      title="Portfolio"
      subtitle="Across active studies: negotiation upside, missing revenue, and the next action to protect site economics."
    >
      <StudyHeader timeWindow="Current view" />

      <Card className="border-border/80 bg-muted/15 shadow-none">
        <CardContent className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">{headline.negotiating}</span> negotiating ·{" "}
            <span className="font-medium text-foreground">{headline.active}</span> active
          </div>
          <div className="font-medium text-foreground tabular-nums">Missing revenue: {formatUsd(headline.missing)}</div>
        </CardContent>
      </Card>

      {err ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Studies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading portfolio…</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No studies found for this site yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Study</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead className="text-right">Negotiation upside</TableHead>
                    <TableHead className="text-right">Missing revenue</TableHead>
                    <TableHead>Next action</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.study_key}>
                      <TableCell className="whitespace-nowrap font-medium">{r.study_key}</TableCell>
                      <TableCell className="whitespace-nowrap capitalize">{r.phase}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {r.upside != null ? formatUsd(r.upside) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {r.missing_revenue != null ? formatUsd(r.missing_revenue) : "—"}
                      </TableCell>
                      <TableCell className="min-w-[220px] text-muted-foreground">{r.next_action}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard?study_key=${encodeURIComponent(r.study_key)}`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "whitespace-nowrap")}
                        >
                          Open
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MvpShell>
  )
}

