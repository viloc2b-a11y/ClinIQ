import { MVP_MOCK, type MvpKpis } from "@/lib/mvp/mock"
import type { TopLeakageRow } from "@/components/mvp/TopLeakageTable"
import { formatUsd } from "@/lib/mvp/format"

export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = { ok: false; error?: string }

export type DataSource = "live" | "fallback"

export type MvpResult<T> = {
  source: DataSource
  value: T
  note?: string
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function fetchApiOk<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; status: number; error?: string }> {
  const res = await fetch(url, { cache: "no-store" })
  const json = await safeJson<{ ok?: unknown; data?: unknown; error?: unknown }>(res)
  if (!res.ok) {
    return { ok: false, status: res.status, error: typeof (json as any)?.error === "string" ? (json as any).error : res.statusText }
  }
  if (!json || (json as any).ok !== true) {
    return { ok: false, status: res.status, error: typeof (json as any)?.error === "string" ? (json as any).error : "Unknown API error" }
  }
  return { ok: true, data: (json as any).data as T }
}

export function daysSince(iso: unknown): number {
  if (typeof iso !== "string" || !iso.trim()) return 0
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  const ms = Date.now() - d.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

function mockLeakageRows(): TopLeakageRow[] {
  return MVP_MOCK.patients.map((p) => ({
    patient: p.id,
    visit: p.visit,
    amount: p.amount,
    daysPending: p.days,
  }))
}

export async function getExecutionSummary(studyKey: string): Promise<MvpResult<MvpKpis>> {
  const fallback: MvpResult<MvpKpis> = { source: "fallback", value: MVP_MOCK.kpis, note: "Demo data" }
  if (!studyKey.trim()) return fallback

  const res = await fetchApiOk<{
    study_key: string | null
    totals: { expected_revenue: number; revenue_gap: number }
    counts?: unknown
    headline?: unknown
    samples?: unknown
  }>(`/api/execution/summary?study_key=${encodeURIComponent(studyKey)}`)

  if (!res.ok) return fallback

  const ready = Number(res.data.totals?.expected_revenue ?? MVP_MOCK.kpis.ready)
  const atRisk = Math.max(0, Number(res.data.totals?.revenue_gap ?? MVP_MOCK.kpis.atRisk))

  return {
    source: "live",
    value: {
      ready: Number.isFinite(ready) ? ready : MVP_MOCK.kpis.ready,
      atRisk: Number.isFinite(atRisk) ? atRisk : MVP_MOCK.kpis.atRisk,
      delayed: MVP_MOCK.kpis.delayed,
      critical: MVP_MOCK.kpis.critical,
    },
  }
}

export async function getLeakageRows(studyKey: string): Promise<MvpResult<TopLeakageRow[]>> {
  const fallback: MvpResult<TopLeakageRow[]> = { source: "fallback", value: mockLeakageRows(), note: "Demo data" }
  if (!studyKey.trim()) return fallback

  const res = await fetchApiOk<any[]>(`/api/execution/leakage?study_id=${encodeURIComponent(studyKey)}&limit=200`)
  if (!res.ok) return fallback
  if (!Array.isArray(res.data) || res.data.length === 0) return fallback

  const mapped: TopLeakageRow[] = res.data.map((r) => ({
    patient: String(r.subject_id ?? "—"),
    visit: String(r.visit_name ?? "—"),
    amount: Number(r.missing_amount ?? 0) || 0,
    daysPending: daysSince(r.created_at ?? r.updated_at ?? r.last_seen_at),
  }))

  return { source: "live", value: mapped.sort((a, b) => b.daysPending - a.daysPending) }
}

export type BillablesRow = {
  patient: string
  visit: string
  event: string
  amount: number
  status: "pending" | "ready" | "billed"
  daysPending: number
}

export async function getBillablesRows(studyKey: string): Promise<MvpResult<BillablesRow[]>> {
  // For now, we treat leakage items as the most defensible "billables at risk" dataset.
  // It is produced by execution/leakage backend logic and is traceable to missing_amount.
  const fallback: MvpResult<BillablesRow[]> = {
    source: "fallback",
    note: "Demo data",
    value: MVP_MOCK.patients.map((p) => ({
      patient: p.id,
      visit: p.visit,
      event: p.event,
      amount: p.amount,
      status: p.status === "ready" ? "ready" : "pending",
      daysPending: p.days,
    })),
  }
  if (!studyKey.trim()) return fallback

  const res = await fetchApiOk<any[]>(`/api/execution/leakage?study_id=${encodeURIComponent(studyKey)}&limit=500`)
  if (!res.ok) return fallback
  if (!Array.isArray(res.data) || res.data.length === 0) return fallback

  const rows: BillablesRow[] = res.data.map((r) => ({
    patient: String(r.subject_id ?? "—"),
    visit: String(r.visit_name ?? "—"),
    event: String(r.leakage_reason ?? r.line_code ?? "missing_billable"),
    amount: Number(r.missing_amount ?? 0) || 0,
    status: "pending",
    daysPending: daysSince(r.created_at ?? r.updated_at ?? r.last_seen_at),
  }))
  return { source: "live", value: rows.sort((a, b) => b.daysPending - a.daysPending) }
}

export type AnalyticsSnapshot = {
  kpis: MvpKpis
  metrics: { metric: string; value: string; impactUsd: number; daysPending: number }[]
  source: DataSource
  note?: string
}

export async function getAnalyticsSnapshot(studyKey: string): Promise<AnalyticsSnapshot> {
  const kpisRes = await getExecutionSummary(studyKey)
  const leakageRes = await getLeakageRows(studyKey)

  const maxDays = Math.max(0, ...leakageRes.value.map((r) => r.daysPending))
  const criticalCount = leakageRes.value.filter((r) => r.daysPending > 30).length
  const delayedCount = leakageRes.value.filter((r) => r.daysPending > 7).length

  const metrics = [
    {
      metric: "Expected revenue (execution)",
      value: formatUsd(kpisRes.value.ready),
      impactUsd: kpisRes.value.ready,
      daysPending: maxDays,
    },
    {
      metric: "Revenue gap (at risk)",
      value: formatUsd(kpisRes.value.atRisk),
      impactUsd: kpisRes.value.atRisk,
      daysPending: maxDays,
    },
    { metric: "Delayed items", value: String(delayedCount), impactUsd: kpisRes.value.atRisk, daysPending: 12 },
    { metric: "Critical items", value: String(criticalCount), impactUsd: kpisRes.value.atRisk, daysPending: 35 },
  ].sort((a, b) => b.daysPending - a.daysPending)

  const source: DataSource = kpisRes.source === "live" || leakageRes.source === "live" ? "live" : "fallback"
  return { kpis: kpisRes.value, metrics, source, note: source === "fallback" ? "Demo data" : undefined }
}

export type CounterofferLine = {
  fee: string
  sponsor: number
  proposed: number
  delta: number
  priority: "must-win" | "tradeoff"
  justification: string
  daysPending: number
}

export type CounterofferData = {
  sponsorOffer: number
  internalTarget: number
  gap: number
  lines: CounterofferLine[]
}

export type NegotiationDealOption = {
  deal_id: string
  study_key: string
  label: string
}

export async function getNegotiationDealsForDemo(studyKey: string): Promise<MvpResult<NegotiationDealOption[]>> {
  const empty: MvpResult<NegotiationDealOption[]> = { source: "fallback", value: [] }
  if (!studyKey.trim()) return empty

  const res = await fetch(`/api/demo/negotiation-deals?study_key=${encodeURIComponent(studyKey)}`, { cache: "no-store" })
  const json = await safeJson<{ ok?: unknown; data?: unknown }>(res)
  if (!res.ok || !json || json.ok !== true || !Array.isArray(json.data)) {
    return { ...empty, note: "Deals list unavailable" }
  }

  const mapped: NegotiationDealOption[] = (json.data as any[]).map((d) => {
    const deal_id = String(d.deal_id ?? "")
    const sk = String(d.study_key ?? studyKey)
    const name = typeof d.study_name === "string" && d.study_name.trim() ? d.study_name.trim() : ""
    const label = name || `${sk} · ${deal_id.slice(0, 8)}…`
    return { deal_id, study_key: sk, label }
  })

  return mapped.length
    ? { source: "live", value: mapped }
    : { source: "fallback", value: [], note: "No open deals for this study" }
}

function counterofferFallbackLines(): CounterofferLine[] {
  const maxDays = Math.max(...MVP_MOCK.patients.map((p) => p.days))
  return MVP_MOCK.counteroffer.map((r) => ({
    fee: r.fee,
    sponsor: r.sponsor,
    proposed: r.proposed,
    delta: r.proposed - r.sponsor,
    priority: r.priority,
    justification:
      r.priority === "must-win"
        ? "Negotiation opportunity tied to revenue at risk and pending billables in this study."
        : "Trade space to close faster while protecting recovery potential.",
    daysPending: maxDays,
  }))
}

export async function getCounterofferData(args: { dealId?: string; studyKey: string }): Promise<MvpResult<CounterofferData>> {
  const fallbackBase: CounterofferData = {
    sponsorOffer: 180_000,
    internalTarget: 240_000,
    gap: 60_000,
    lines: counterofferFallbackLines(),
  }

  const leakageRes = await getLeakageRows(args.studyKey)
  const maxDays = Math.max(0, ...leakageRes.value.map((r) => r.daysPending))

  const dealId = (args.dealId ?? "").trim()

  const fallbackNoDeal: MvpResult<CounterofferData> = {
    source: "fallback",
    note: "Coordinated demo negotiation scenario",
    value: { ...fallbackBase, lines: counterofferFallbackLines().map((l) => ({ ...l, daysPending: maxDays || l.daysPending })) },
  }

  if (!dealId) return fallbackNoDeal

  const res = await fetch(`/api/demo/negotiation-items?deal_id=${encodeURIComponent(dealId)}`, { cache: "no-store" })
  const json = await safeJson<{ ok?: unknown; data?: unknown }>(res)
  if (!res.ok || !json || json.ok !== true || !Array.isArray(json.data) || json.data.length === 0) {
    return {
      source: "fallback",
      note: "Demo negotiation lines — this deal has no saved line items yet",
      value: {
        ...fallbackBase,
        lines: counterofferFallbackLines().map((l) => ({ ...l, daysPending: maxDays || l.daysPending })),
      },
    }
  }

  const items = json.data as any[]
  const lines: CounterofferLine[] = items.map((it: any) => {
    const fee = String(it.label ?? it.line_code ?? it.source_line_id ?? "Line")
    const sponsor = Number(it.current_price ?? 0) || 0
    const proposed = Number(it.proposed_price ?? 0) || Number(it.internal_cost ?? 0) || 0
    const priority: CounterofferLine["priority"] = proposed - sponsor > 0 ? "must-win" : "tradeoff"
    return {
      fee,
      sponsor,
      proposed,
      delta: proposed - sponsor,
      priority,
      justification: String(it.justification ?? "").trim() || "—",
      daysPending: maxDays,
    }
  })

  const sponsorOffer = items.reduce((s, it) => s + (Number(it.current_price ?? 0) || 0), 0)
  const internalTarget = items.reduce((s, it) => {
    const p = Number(it.proposed_price ?? 0) || 0
    const ic = Number(it.internal_cost ?? 0) || 0
    return s + (p || ic)
  }, 0)

  return {
    source: "live",
    value: {
      sponsorOffer: sponsorOffer || fallbackBase.sponsorOffer,
      internalTarget: internalTarget || fallbackBase.internalTarget,
      gap: (internalTarget || fallbackBase.internalTarget) - (sponsorOffer || fallbackBase.sponsorOffer),
      lines: lines.sort((a, b) => b.daysPending - a.daysPending),
    },
  }
}

// -----------------------
// Beta/mock modules (explicit)
// -----------------------

export type DocumentsDemoRow = {
  file: string
  type: string
  status: "processing" | "ready" | "error"
  confidence: number
  daysPending: number
  impactUsd: number
}

export function getDocumentsDemo(): MvpResult<DocumentsDemoRow[]> {
  const maxDays = Math.max(...MVP_MOCK.patients.map((p) => p.days))
  return {
    source: "fallback",
    note: "Demo data (document ingestion backend not wired yet)",
    value: [
      { file: "SoA.xlsx", type: "schedule-of-assessments", status: "ready", confidence: 0.86, daysPending: maxDays, impactUsd: MVP_MOCK.kpis.atRisk },
      { file: "Budget.pdf", type: "budget", status: "processing", confidence: 0.72, daysPending: maxDays, impactUsd: MVP_MOCK.kpis.ready },
    ],
  }
}

export type StudyBuildDemoRow = { area: string; status: "ready" | "needs-review"; daysPending: number; impactUsd: number }

export function getStudyBuildDemo(): MvpResult<StudyBuildDemoRow[]> {
  const maxDays = Math.max(...MVP_MOCK.patients.map((p) => p.days))
  return {
    source: "fallback",
    note: "Demo data (study build/model backend not wired yet)",
    value: ([
      { area: "Document coverage", status: "needs-review", daysPending: maxDays, impactUsd: MVP_MOCK.kpis.atRisk },
      { area: "Rate rules", status: "needs-review", daysPending: 12, impactUsd: MVP_MOCK.kpis.ready },
      { area: "Event → billable mapping", status: "needs-review", daysPending: 35, impactUsd: MVP_MOCK.kpis.atRisk },
      { area: "Published model", status: "ready", daysPending: 5, impactUsd: MVP_MOCK.kpis.ready },
    ] satisfies StudyBuildDemoRow[]).sort((a, b) => b.daysPending - a.daysPending),
  }
}

export type TaskDemoRow = { title: string; amount: number; daysPending: number; priority: "delayed" | "critical"; status: "open" | "in-progress" | "done" }

export function getTasksDemo(): MvpResult<TaskDemoRow[]> {
  function priorityFromDays(days: number): TaskDemoRow["priority"] {
    return days > 30 ? "critical" : "delayed"
  }

  return {
    source: "fallback",
    note: "Demo data (tasks persistence not enabled)",
    value: (MVP_MOCK.patients
      .map((p) => ({
        title: `Resolve billing delay: ${p.id} ${p.visit}`,
        amount: p.amount,
        daysPending: p.days,
        priority: priorityFromDays(p.days),
        status: "open" as TaskDemoRow["status"],
      }))
      .sort((a, b) => b.daysPending - a.daysPending)) satisfies TaskDemoRow[],
  }
}

