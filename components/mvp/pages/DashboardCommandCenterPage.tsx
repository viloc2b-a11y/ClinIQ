"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
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

function PhasePill({ phase }: { phase: Phase }) {
  const map: Record<Phase, { label: string; cls: string }> = {
    draft:       { label: "Intake",      cls: "bg-muted text-muted-foreground border border-border/60" },
    negotiating: { label: "Negotiating", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
    active:      { label: "Active",      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    closeout:    { label: "Closeout",    cls: "bg-red-50 text-red-700 border border-red-200" },
  }
  const { label, cls } = map[phase] ?? map.draft
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function ActionCTA({ row }: { row: DashboardRow }) {
  const isNeg = row.phase === "draft" || row.phase === "negotiating"
  const href = isNeg
    ? `/counteroffer?study_key=${encodeURIComponent(row.study_key)}`
    : `/dashboard?study_key=${encodeURIComponent(row.study_key)}`
  const label =
    row.phase === "draft"       ? "Start →" :
    row.phase === "negotiating" ? "Build Counter →" :
    row.phase === "closeout"    ? "Resolve →" :
                                  "Open →"
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: isNeg ? "default" : "outline", size: "sm" }),
        "whitespace-nowrap text-xs",
        isNeg && "bg-foreground text-background hover:bg-foreground/90",
      )}
    >
      {label}
    </Link>
  )
}

export function DashboardCommandCenterPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [data, setData] = useState<DashboardPayload | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function loadDashboard({ showSpinner }: { showSpinner: boolean }) {
    if (showSpinner) setLoading(true)
    setErr(null)
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" })
      const json = (await res.json()) as { ok?: unknown; error?: unknown; data?: DashboardPayload }
      if (!res.ok || json.ok !== true || !json.data) {
        throw new Error(typeof json.error === "string" ? json.error : "Dashboard failed to load")
      }
      setData(json.data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  function scheduleSoftRefetch() {
    if (document.visibilityState !== "visible") return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void loadDashboard({ showSpinner: false }), 250)
  }

  useEffect(() => {
    void loadDashboard({ showSpinner: true })
    document.addEventListener("visibilitychange", scheduleSoftRefetch)
    window.addEventListener("focus", scheduleSoftRefetch)
    return () => {
      document.removeEventListener("visibilitychange", scheduleSoftRefetch)
      window.removeEventListener("focus", scheduleSoftRefetch)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows      = data?.portfolio_rows ?? []
  const kpis      = data?.kpis
  const phaseDist = data?.phase_distribution ?? {}
  const negRows   = rows.filter(r => r.phase === "draft" || r.phase === "negotiating")
  const execRows  = rows.filter(r => r.phase === "active" || r.phase === "closeout")

  const inNegotiation  = (phaseDist.draft ?? 0) + (phaseDist.negotiating ?? 0)
  const upsideTotal    = rows.reduce((s, r) => s + (r.phase === "negotiating" ? r.upside : 0), 0)
  const awaitingAction = negRows.filter(r => r.phase === "negotiating").length
  const closedMtd      = phaseDist.active ?? 0
  const immediateActions = rows.filter(r => r.phase === "negotiating" && r.upside > 0).slice(0, 3)

  return (
    <MvpShell
      title="Negotiation Hub"
      subtitle="Win more in every sponsor negotiation. Track position, build counters, close better deals."
    >
      {err ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {err}
        </p>
      ) : null}

      {!loading && immediateActions.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Action Required</p>
          <div className="flex flex-wrap gap-2">
            {immediateActions.map(r => (
              <Link
                key={r.study_key}
                href={`/counteroffer?study_key=${encodeURIComponent(r.study_key)}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 shadow-sm hover:bg-amber-50"
              >
                <span>{r.study_key}</span>
                <span className="text-amber-500">·</span>
                <span className="text-xs text-amber-600">+{formatUsd(r.upside)} upside</span>
                <span className="ml-1 text-amber-500">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-foreground/20">
          <CardHeader className="pb-0"><CardTitle className="text-xs font-medium text-muted-foreground">In Negotiation</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{loading ? "—" : inNegotiation}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">studies</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-0"><CardTitle className="text-xs font-medium text-amber-700">Upside Available</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-amber-700">{loading ? "—" : formatUsd(upsideTotal)}</div>
            <p className="mt-0.5 text-xs text-amber-600">on open deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0"><CardTitle className="text-xs font-medium text-muted-foreground">Awaiting Counter</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{loading ? "—" : awaitingAction}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">deals need action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0"><CardTitle className="text-xs font-medium text-muted-foreground">Agreements Closed</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{loading ? "—" : closedMtd}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">active studies</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-0">
          <CardTitle>Negotiation Pipeline</CardTitle>
          <Link href="/counteroffer" className={cn(buttonVariants({ variant: "default", size: "sm" }), "text-xs")}>+ New Negotiation</Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : negRows.length === 0 ? (
            <div className="py-10 text-center">
              <p className="mb-3 text-sm text-muted-foreground">No active negotiations yet.</p>
              <Link href="/documents" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>Upload Budget → Start Intake</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Study</TableHead>
                    <TableHead>Sponsor / CRO</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Upside</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {negRows.map(r => (
                    <TableRow key={r.study_key} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap font-semibold">{r.study_key}</TableCell>
                      <TableCell className="min-w-[180px] text-sm text-muted-foreground">
                        {(r.sponsor_name || r.cro_name) ? [r.sponsor_name, r.cro_name].filter(Boolean).join(" · ") : "—"}
                      </TableCell>
                      <TableCell><PhasePill phase={r.phase} /></TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-amber-700">
                        {r.upside > 0 ? `+${formatUsd(r.upside)}` : "—"}
                      </TableCell>
                      <TableCell className="min-w-[200px] text-sm text-muted-foreground">{r.next_action}</TableCell>
                      <TableCell className="text-right"><ActionCTA row={r} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {execRows.length > 0 && (
        <details className="group rounded-lg border border-border/50 bg-muted/10">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
            <span>Execution & Closeout <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{execRows.length}</span></span>
            <span className="text-xs group-open:hidden">▼ Show</span>
            <span className="hidden text-xs group-open:inline">▲ Hide</span>
          </summary>
          <div className="border-t border-border/50 px-4 pb-4 pt-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Study</TableHead><TableHead>Status</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead className="text-right">At Risk</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {execRows.map(r => (
                    <TableRow key={r.study_key}>
                      <TableCell className="whitespace-nowrap font-medium">{r.study_key}</TableCell>
                      <TableCell><PhasePill phase={r.phase} /></TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">{formatUsd(r.expected_revenue)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">{formatUsd(r.billed_revenue)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums text-destructive">{r.at_risk_revenue > 0 ? formatUsd(r.at_risk_revenue) : "—"}</TableCell>
                      <TableCell className="text-right"><ActionCTA row={r} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </details>
      )}

      {((kpis?.expected_revenue ?? 0) + (kpis?.revenue_at_risk ?? 0)) > 0 && (
        <div className="grid grid-cols-2 gap-3 opacity-70 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-0"><CardTitle className="text-xs font-medium text-muted-foreground">Expected Revenue</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-semibold tabular-nums">{loading ? "—" : formatUsd(kpis?.expected_revenue ?? 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-0"><CardTitle className="text-xs font-medium text-muted-foreground">Revenue at Risk</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-semibold tabular-nums text-destructive">{loading ? "—" : formatUsd(kpis?.revenue_at_risk ?? 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-0"><CardTitle className="text-xs font-medium text-muted-foreground">Closeout Exposure</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-semibold tabular-nums">{loading ? "—" : formatUsd(kpis?.closeout_exposure ?? 0)}</div></CardContent>
          </Card>
        </div>
      )}
    </MvpShell>
  )
}
