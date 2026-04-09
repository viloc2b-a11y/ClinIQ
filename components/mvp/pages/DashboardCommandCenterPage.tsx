"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatUsd } from "@/lib/mvp/format"
import { MvpShell } from "@/components/mvp/MvpShell"

type Phase = "draft" | "negotiating" | "active" | "closeout"

type DashboardRow = {
  study_key: string
  phase: Phase
  sponsor_name: string | null
  cro_name: string | null
  upside: number
  expected_revenue: number
  billed_revenue: number
  collected_revenue: number
  at_risk_revenue: number
  closeout_exposure: number
  next_action: string
}

type DashboardPayload = {
  kpis: {
    active_studies: number
    negotiation_upside: number
    expected_revenue: number
    revenue_at_risk: number
    closeout_exposure: number
  }
  phase_distribution: Partial<Record<Phase, number>>
  portfolio_rows: DashboardRow[]
  needs_attention: DashboardRow[]
}

function phaseBadge(phase: Phase) {
  if (phase === "closeout") return <Badge variant="outline">Closeout</Badge>
  if (phase === "active") return <Badge variant="secondary">Active</Badge>
  if (phase === "negotiating") return <Badge variant="outline">Negotiating</Badge>
  return <Badge variant="outline">Draft</Badge>
}

export function DashboardCommandCenterPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [data, setData] = useState<DashboardPayload | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setErr(null)
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" })
        const json = (await res.json()) as { ok?: unknown; error?: unknown; data?: DashboardPayload }
        if (!res.ok || json.ok !== true || !json.data) {
          throw new Error(typeof json.error === "string" ? json.error : "Dashboard failed to load")
        }
        if (!cancelled) setData(json.data)
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

  const kpis = data?.kpis
  const phaseDist = data?.phase_distribution ?? {}
  const rows = data?.portfolio_rows ?? []

  const revenueFunnel = useMemo(() => {
    const expected = rows.reduce((s, r) => s + (r.expected_revenue ?? 0), 0)
    const billed = rows.reduce((s, r) => s + (r.billed_revenue ?? 0), 0)
    const collected = rows.reduce((s, r) => s + (r.collected_revenue ?? 0), 0)
    const atRisk = rows.reduce((s, r) => s + (r.at_risk_revenue ?? 0), 0)
    return { expected, billed, collected, atRisk }
  }, [rows])

  return (
    <MvpShell
      title="Financial Control Across All Active Studies"
      subtitle="Negotiate better. Track expected vs actual. Close without leaving revenue behind."
    >
      {err ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      ) : null}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Studies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {loading ? "—" : String(kpis?.active_studies ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Negotiation Upside</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {loading ? "—" : formatUsd(kpis?.negotiation_upside ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Expected Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {loading ? "—" : formatUsd(kpis?.expected_revenue ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Revenue at Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums text-destructive">
              {loading ? "—" : formatUsd(kpis?.revenue_at_risk ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Closeout Exposure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {loading ? "—" : formatUsd(kpis?.closeout_exposure ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Portfolio</CardTitle>
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
                    <TableHead>Sponsor / CRO</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead className="text-right">Negotiation</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">At Risk</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.study_key}>
                      <TableCell className="whitespace-nowrap font-medium">{r.study_key}</TableCell>
                      <TableCell className="min-w-[200px] text-sm text-muted-foreground">
                        {(r.sponsor_name || r.cro_name)
                          ? [r.sponsor_name, r.cro_name].filter(Boolean).join(" · ")
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{phaseBadge(r.phase)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {r.phase === "negotiating" && r.upside > 0 ? `+${formatUsd(r.upside)}` : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {formatUsd(r.expected_revenue)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {formatUsd(r.billed_revenue)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {formatUsd(r.collected_revenue)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-destructive">
                        {formatUsd(r.at_risk_revenue)}
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

      {/* Needs attention */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Needs Attention Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (data?.needs_attention?.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No high-priority items right now.</p>
          ) : (
            data!.needs_attention.slice(0, 5).map((r) => (
              <div key={`attn-${r.study_key}`} className="flex flex-col gap-1 rounded-md border border-border/60 bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{r.study_key}</span>{" "}
                  <span className="text-muted-foreground">·</span>{" "}
                  <span className="text-muted-foreground">
                    {r.phase === "negotiating"
                      ? `${formatUsd(r.upside)} upside`
                      : r.phase === "closeout"
                        ? `${formatUsd(r.closeout_exposure)} closeout exposure`
                        : `${formatUsd(r.at_risk_revenue)} at risk`}
                  </span>
                </div>
                <Link
                  href={`/dashboard?study_key=${encodeURIComponent(r.study_key)}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "whitespace-nowrap")}
                >
                  Open
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Phase distribution + Revenue performance */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Phase Distribution</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">Draft</div>
              <div className="text-lg font-semibold tabular-nums">{phaseDist.draft ?? 0}</div>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">Negotiating</div>
              <div className="text-lg font-semibold tabular-nums">{phaseDist.negotiating ?? 0}</div>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">Active</div>
              <div className="text-lg font-semibold tabular-nums">{phaseDist.active ?? 0}</div>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">Closeout</div>
              <div className="text-lg font-semibold tabular-nums">{phaseDist.closeout ?? 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Revenue Performance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">Expected</div>
              <div className="text-lg font-semibold tabular-nums">{formatUsd(revenueFunnel.expected)}</div>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">Billed</div>
              <div className="text-lg font-semibold tabular-nums">{formatUsd(revenueFunnel.billed)}</div>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">Collected</div>
              <div className="text-lg font-semibold tabular-nums">{formatUsd(revenueFunnel.collected)}</div>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
              <div className="text-xs text-muted-foreground">At Risk</div>
              <div className="text-lg font-semibold tabular-nums text-destructive">{formatUsd(revenueFunnel.atRisk)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MvpShell>
  )
}

