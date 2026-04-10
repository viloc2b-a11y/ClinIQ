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
  if (phase === "active") return <Badge variant="secondary">Agreed</Badge>
  if (phase === "negotiating") return <Badge variant="outline">In negotiation</Badge>
  return <Badge variant="outline">Intake</Badge>
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
      title="Negotiation Hub"
      subtitle="Win more in every sponsor negotiation — see what’s waiting on you and make the next move."
    >
      {err ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      ) : null}

      {/* Immediate actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/80 bg-muted/15 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Start intake</CardTitle>
            <p className="text-xs text-muted-foreground">Upload a sponsor offer and generate negotiation lines.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/import" className={cn(buttonVariants({ variant: "default", size: "sm" }), "whitespace-nowrap")}>
              Intake sponsor offer
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-muted/15 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Build your counter</CardTitle>
            <p className="text-xs text-muted-foreground">Turn line-level gaps into sponsor-ready language.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/counteroffer" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "whitespace-nowrap")}>
              Open counteroffer
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-muted/15 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Track studies</CardTitle>
            <p className="text-xs text-muted-foreground">See what’s in negotiation vs downstream execution.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/portfolio" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "whitespace-nowrap")}>
              View studies
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Studies in negotiation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {loading ? "—" : String(phaseDist.negotiating ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total upside available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {loading ? "—" : formatUsd(kpis?.negotiation_upside ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg sponsor gap %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {loading
                ? "—"
                : (() => {
                    // Derived proxy: upside vs portfolio expected (only when available)
                    const denom = Math.max(1, revenueFunnel.expected || 0)
                    const gap = Math.max(0, kpis?.negotiation_upside ?? 0)
                    const pct = Math.min(99, Math.round((gap / denom) * 100))
                    return `${pct}%`
                  })()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Deals awaiting counter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {loading ? "—" : String((data?.needs_attention ?? []).length)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Agreements closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {loading ? "—" : String(phaseDist.active ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Negotiation pipeline */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Negotiation pipeline</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Active studies, upside, and your next move.</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading pipeline…</p>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No active negotiations yet.</p>
              <p className="mt-1">Start by uploading a sponsor offer.</p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href="/import" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                  Intake sponsor offer
                </Link>
                <Link href="/negotiation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Open negotiation workspace
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Study</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead className="text-right">Sponsor offer</TableHead>
                    <TableHead className="text-right">Your target</TableHead>
                    <TableHead className="text-right">Upside</TableHead>
                    <TableHead>Next action</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const sponsorOffer = Math.max(0, r.expected_revenue - (r.upside ?? 0))
                    const target = Math.max(0, r.expected_revenue)
                    const upside = Math.max(0, r.upside ?? 0)
                    const phaseLabel =
                      r.phase === "draft"
                        ? "intake"
                        : r.phase === "negotiating"
                          ? "analyzing"
                          : r.phase === "active"
                            ? "agreed"
                            : "closeout"
                    return (
                      <TableRow key={r.study_key}>
                        <TableCell className="whitespace-nowrap font-medium">{r.study_key}</TableCell>
                        <TableCell className="min-w-[180px] text-sm text-muted-foreground">{r.sponsor_name || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="capitalize">
                            {phaseLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                          {r.phase === "negotiating" ? formatUsd(sponsorOffer) : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                          {r.phase === "negotiating" ? formatUsd(target) : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                          {r.phase === "negotiating" && upside > 0 ? `+${formatUsd(upside)}` : "—"}
                        </TableCell>
                        <TableCell className="min-w-[190px]">
                          {r.phase === "negotiating" ? (
                            <Link href="/counteroffer" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                              Build counter
                            </Link>
                          ) : r.phase === "draft" ? (
                            <Link href="/import" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                              Start intake
                            </Link>
                          ) : (
                            <Link href="/billables" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                              View execution
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/dashboard?study_key=${encodeURIComponent(r.study_key)}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "whitespace-nowrap")}
                          >
                            Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Immediate attention */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Next moves</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">High priority items you can act on now.</p>
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
                      : r.phase === "draft"
                        ? "Intake ready"
                        : r.phase === "active"
                          ? "Ready to publish + execute"
                          : "Downstream closeout"}
                  </span>
                </div>
                <Link
                  href={r.phase === "negotiating" ? "/counteroffer" : r.phase === "draft" ? "/import" : "/billables"}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "whitespace-nowrap")}
                >
                  {r.phase === "negotiating" ? "Build counter" : r.phase === "draft" ? "Start intake" : "View execution"}
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Secondary / downstream */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Deal stages</CardTitle>
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

        <Card className="border-border/70 bg-muted/10 shadow-none">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Execution snapshot (downstream)</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              These are execution totals after a deal is agreed and published.
            </p>
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

