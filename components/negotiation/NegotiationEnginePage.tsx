"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { computeNegotiationFinancialSummary, stableNegotiationLineKey } from "@/lib/negotiation/financial"
import { buildHoustonMetabolicNegotiationInput } from "@/features/negotiation/mock-from-budget-gap"
import type { NegotiationEngineInput } from "@/lib/cliniq-core/budget-gap/negotiation-input"
import {
  buildNegotiationPackage,
  counterofferLinesToCsv,
  generateEmailDraft,
  NEGOTIATION_ENGINE_INPUT_SESSION_KEY,
  negotiationPackageToJson,
  type NegotiationStrategy,
} from "@/lib/cliniq-core/negotiation/client"

const LS_DEAL_BY_STUDY = "cliniq.negotiation.dealIdByStudy.v1"

type UiItem = {
  stableKey: string
  sourceLineId: string
  lineCode: string
  label: string
  category: string
  visitName: string
  quantity: number
  unit: string
  currentPrice: number
  internalCost: number
  proposedPrice: number
  justification: string
  status: "pending" | "accepted" | "rejected"
}

function formatUsd(n: number): string {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

export default function NegotiationEnginePage() {
  const [engineInput, setEngineInput] = useState<NegotiationEngineInput | null>(
    null,
  )
  const [strategy, setStrategy] = useState<NegotiationStrategy>("balanced")
  const [paste, setPaste] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [dealId, setDealId] = useState<string | null>(null)
  const [dealVersion, setDealVersion] = useState<number | null>(null)
  const [dealLastUpdatedAt, setDealLastUpdatedAt] = useState<string | null>(null)
  const [dealLastUpdatedBy, setDealLastUpdatedBy] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ expected: number; current?: any } | null>(null)
  const [items, setItems] = useState<UiItem[]>([])
  const [busy, setBusy] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [closedAt, setClosedAt] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(NEGOTIATION_ENGINE_INPUT_SESSION_KEY)
    if (!raw) return
    try {
      const d = JSON.parse(raw) as NegotiationEngineInput
      if (d.schemaVersion !== "1.0" || !Array.isArray(d.lines)) {
        sessionStorage.removeItem(NEGOTIATION_ENGINE_INPUT_SESSION_KEY)
        return
      }
      setEngineInput(d)
      setErr(null)
    } catch {
      setErr("invalid handoff payload")
    } finally {
      sessionStorage.removeItem(NEGOTIATION_ENGINE_INPUT_SESSION_KEY)
    }
  }, [])

  useEffect(() => {
    if (!engineInput) return
    // Reuse dealId per study so negotiation survives reimport/refresh.
    const studyId = engineInput.studyMeta?.studyId ?? "STUDY-1"
    let nextDealId = ""
    try {
      const raw = localStorage.getItem(LS_DEAL_BY_STUDY)
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
      nextDealId = String(map[studyId] ?? "").trim()
      if (!nextDealId) {
        nextDealId = crypto.randomUUID()
        map[studyId] = nextDealId
        localStorage.setItem(LS_DEAL_BY_STUDY, JSON.stringify(map))
      }
    } catch {
      nextDealId = crypto.randomUUID()
    }
    setDealId(null)
    setDealVersion(null)
    setDealLastUpdatedAt(null)
    setDealLastUpdatedBy(null)
    setConflict(null)
    setClosedAt(null)
    setSavedAt(null)
    setItems(
      engineInput.lines.map((l) => ({
        stableKey: stableNegotiationLineKey({
          lineCode: l.lineCode,
          category: l.category,
          visitName: l.visitName,
          label: l.label,
          unit: l.unit,
        }),
        sourceLineId: l.id,
        lineCode: l.lineCode,
        label: l.label,
        category: l.category,
        visitName: l.visitName,
        quantity: l.quantity,
        unit: l.unit,
        currentPrice: l.sponsorTotalOffer,
        internalCost: l.internalTotal,
        proposedPrice: l.sponsorTotalOffer,
        justification: "",
        status: "pending",
      })),
    )

    // Prefer DB-resolved active deal for this study (cross-device).
    const resolve = async () => {
      try {
        const res = await fetch(
          `/api/negotiation/active?studyKey=${encodeURIComponent(studyId)}&studyName=${encodeURIComponent(
            engineInput.studyMeta?.studyName ?? "",
          )}`,
          { credentials: "include" },
        )
        const json = (await res.json()) as { ok?: boolean; deal?: any; error?: string }
        if (!res.ok || !json.ok || !json.deal?.deal_id) throw new Error(json.error ?? "active deal failed")
        const d = json.deal
        setDealId(String(d.deal_id))
        setDealVersion(typeof d.version === "number" ? d.version : Number(d.version) || 1)
        setDealLastUpdatedAt(String(d.last_updated_at ?? ""))
        setDealLastUpdatedBy(String(d.last_updated_by ?? ""))
      } catch {
        // Local fallback remains if DB resolution fails.
        setDealId(nextDealId)
      }
    }
    void resolve()
  }, [engineInput])

  useEffect(() => {
    const run = async () => {
      if (!dealId) return
      try {
        const res = await fetch(`/api/negotiation/items?dealId=${encodeURIComponent(dealId)}`, {
          credentials: "include",
        })
        const json = (await res.json()) as { ok?: boolean; error?: string; items?: any[]; deal?: any }
        if (!res.ok || !json.ok) return
        if (!Array.isArray(json.items) || json.items.length === 0) return

        // Prefer stable_key match; fall back to source_line_id.
        const byStable = new Map(json.items.map((r) => [String(r.stable_key ?? ""), r] as const))
        const bySource = new Map(json.items.map((r) => [String(r.source_line_id), r] as const))
        setItems((prev) =>
          prev.map((p) => {
            const r = (p.stableKey ? byStable.get(p.stableKey) : undefined) ?? bySource.get(p.sourceLineId)
            if (!r) return p
            return {
              ...p,
              proposedPrice: Number(r.proposed_price) || 0,
              justification: String(r.justification ?? ""),
              status: (r.status as UiItem["status"]) ?? "pending",
            }
          }),
        )

        const meta = json.deal
        if (meta?.version) {
          const v = typeof meta.version === "number" ? meta.version : Number(meta.version) || null
          if (v !== null) {
            if (dealVersion !== null && v !== dealVersion) {
              setConflict({ expected: dealVersion, current: meta })
            }
            setDealVersion(v)
          }
          if (meta.last_updated_at) setDealLastUpdatedAt(String(meta.last_updated_at))
          if (meta.last_updated_by) setDealLastUpdatedBy(String(meta.last_updated_by))
        }
        setSavedAt(new Date().toISOString())
      } catch {
        // ignore
      }
    }
    void run()
  }, [dealId, dealVersion])

  const pkg = useMemo(() => {
    if (!engineInput) return null
    return buildNegotiationPackage({ input: engineInput, strategy })
  }, [engineInput, strategy])

  const email = useMemo(() => (pkg ? generateEmailDraft(pkg) : null), [pkg])

  const financials = useMemo(() => {
    return computeNegotiationFinancialSummary(
      items.map((it) => ({
        current_price: it.currentPrice,
        internal_cost: it.internalCost,
        proposed_price: it.proposedPrice,
        status: it.status,
      })),
    )
  }, [items])

  const save = async () => {
    if (!dealId || !engineInput) return
    setBusy(true)
    setErr(null)
    setConflict(null)
    try {
      const res = await fetch("/api/negotiation/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dealId,
          studyKey: engineInput.studyMeta?.studyId ?? "STUDY-1",
          studyName: engineInput.studyMeta?.studyName ?? null,
          expectedVersion: dealVersion ?? undefined,
          items: items.map((it) => ({ ...it, stableKey: it.stableKey })),
        }),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string; conflict?: any; deal?: any }
      if (res.status === 409) {
        setErr(json.error ?? "Conflict")
        setConflict({
          expected: dealVersion ?? 0,
          current: json.conflict?.current,
        })
        return
      }
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Save failed")
        return
      }
      setSavedAt(new Date().toISOString())
      if (json.deal?.version) {
        const v = typeof json.deal.version === "number" ? json.deal.version : Number(json.deal.version) || null
        if (v !== null) setDealVersion(v)
      } else if (dealVersion !== null) {
        setDealVersion(dealVersion + 1)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  const closeDeal = async () => {
    if (!dealId || !engineInput) return
    setBusy(true)
    setErr(null)
    try {
      // Ensure latest rows are persisted before closure snapshot.
      await save()
      const res = await fetch("/api/negotiation/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dealId,
          studyKey: engineInput.studyMeta?.studyId ?? "STUDY-1",
          studyName: engineInput.studyMeta?.studyName ?? null,
          engineInput,
        }),
      })
      const json = (await res.json()) as { ok?: boolean; error?: string; agreement?: { closed_at?: string } }
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Close failed")
        return
      }
      setClosedAt(json.agreement?.closed_at ?? new Date().toISOString())
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Close failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <h1 className="font-semibold text-lg">Negotiation engine (Module 4)</h1>
      <p className="text-muted-foreground text-sm">
        After a Budget Gap run, choose “Sponsor counteroffer (Module 4)” on the gap page to load{" "}
        <code className="text-xs">NegotiationEngineInput</code> here, or paste JSON / load mock.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setEngineInput(buildHoustonMetabolicNegotiationInput())}>
          Load mock input
        </Button>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as NegotiationStrategy)}
        >
          <option value="conservative">conservative</option>
          <option value="balanced">balanced</option>
          <option value="firm">firm</option>
        </select>
      </div>

      <Textarea
        placeholder="Paste NegotiationEngineInput JSON"
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        rows={3}
        className="font-mono text-xs"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!paste.trim()}
        onClick={() => {
          try {
            const d = JSON.parse(paste) as NegotiationEngineInput
            if (d.schemaVersion !== "1.0" || !Array.isArray(d.lines)) throw new Error("bad shape")
            setEngineInput(d)
            setErr(null)
          } catch {
            setErr("invalid json")
            setEngineInput(null)
          }
        }}
      >
        Parse JSON
      </Button>
      {err ? <p className="text-destructive text-sm">{err}</p> : null}
      {conflict ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900 dark:text-amber-100">
          <div className="font-medium text-sm">Conflict detected</div>
          <div className="text-xs opacity-90">
            Someone saved newer changes after you loaded this deal. Reload the page (or re-open the
            deal) to merge, then try saving again.
            {dealLastUpdatedAt ? ` Last update: ${new Date(dealLastUpdatedAt).toLocaleString()}.` : ""}
          </div>
        </div>
      ) : null}

      {engineInput ? (
        <div className="grid gap-3 md:grid-cols-5">
          <Card className="md:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Deal financials (live)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-muted-foreground text-xs">total_sponsor</div>
                <div className="font-semibold text-lg">{formatUsd(financials.total_sponsor)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">total_internal</div>
                <div className="font-semibold text-lg">{formatUsd(financials.total_internal)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">total_target</div>
                <div className="font-semibold text-lg">{formatUsd(financials.total_target)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">upside</div>
                <div className="font-semibold text-lg">{formatUsd(financials.upside)}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-muted-foreground text-xs">margin</div>
                <div className="font-mono text-sm">{formatPct(financials.margin)}</div>
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
                <Button type="button" onClick={() => void save()} disabled={busy || !dealId}>
                  Save negotiation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void closeDeal()}
                  disabled={busy || !dealId || !!closedAt}
                >
                  {closedAt ? "Deal closed" : "Close deal"}
                </Button>
                <div className="text-muted-foreground text-xs self-center">
                  {savedAt ? `saved ${new Date(savedAt).toLocaleString()}` : "not saved yet"}
                  {closedAt ? ` · closed ${new Date(closedAt).toLocaleString()}` : ""}
                  {dealVersion !== null ? ` · v${dealVersion}` : ""}
                  {dealLastUpdatedBy ? ` · last by ${dealLastUpdatedBy.slice(0, 8)}…` : ""}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lines (edit)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-muted-foreground text-xs">
                Proposed price and status update the totals instantly.
              </div>
              <div className="max-h-[420px] overflow-auto rounded-md border border-border">
                <div className="divide-y">
                  {items.map((it) => (
                    <div key={it.sourceLineId} className="p-3 space-y-2">
                      <div className="text-xs">
                        <div className="font-medium">{it.label}</div>
                        <div className="text-muted-foreground">
                          {it.lineCode} · {it.visitName} · {formatUsd(it.currentPrice)} current ·{" "}
                          {formatUsd(it.internalCost)} internal
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="w-[180px]">
                          <div className="text-muted-foreground text-[0.7rem]">proposed_price</div>
                          <input
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={String(it.proposedPrice)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const v = Number(e.target.value)
                              setItems((prev) =>
                                prev.map((p) =>
                                  p.sourceLineId === it.sourceLineId
                                    ? { ...p, proposedPrice: Number.isFinite(v) ? v : 0 }
                                    : p,
                                ),
                              )
                            }}
                            inputMode="decimal"
                          />
                        </div>
                        <div>
                          <div className="text-muted-foreground text-[0.7rem]">status</div>
                          <select
                            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            value={it.status}
                            onChange={(e) => {
                              const v = e.target.value as UiItem["status"]
                              setItems((prev) =>
                                prev.map((p) =>
                                  p.sourceLineId === it.sourceLineId ? { ...p, status: v } : p,
                                ),
                              )
                            }}
                          >
                            <option value="pending">pending</option>
                            <option value="accepted">accepted</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </div>
                      </div>
                      <Textarea
                        placeholder="justification"
                        value={it.justification}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((p) =>
                              p.sourceLineId === it.sourceLineId
                                ? { ...p, justification: e.target.value }
                                : p,
                            ),
                          )
                        }
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {pkg && email ? (
        <>
          <Textarea
            readOnly
            value={negotiationPackageToJson(pkg)}
            rows={12}
            className="font-mono text-xs"
          />
          <Textarea readOnly value={email.fullText} rows={10} className="font-mono text-xs" />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const a = document.createElement("a")
                a.href = URL.createObjectURL(
                  new Blob(
                    [
                      JSON.stringify(
                        { negotiationPackage: pkg, sponsorEmailDraft: email },
                        null,
                        2,
                      ),
                    ],
                    { type: "application/json" },
                  ),
                )
                a.download = `${pkg.studyId ?? "pkg"}.json`
                a.click()
              }}
            >
              Download JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const a = document.createElement("a")
                a.href = URL.createObjectURL(
                  new Blob([counterofferLinesToCsv(pkg.counterofferLines)], {
                    type: "text/csv",
                  }),
                )
                a.download = `${pkg.studyId ?? "counteroffer"}.csv`
                a.click()
              }}
            >
              Download CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void navigator.clipboard.writeText(email.fullText)}
            >
              Copy email
            </Button>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Load mock or parse JSON to see output.</p>
      )}
    </main>
  )
}
