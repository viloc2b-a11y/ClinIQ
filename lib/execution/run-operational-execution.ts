import type { SupabaseClient } from "@supabase/supabase-js"

import { getActionCenterPersistenceAdapter } from "@/lib/cliniq-core/action-center/get-persistence-adapter"
import { isSupabasePersistenceEnabled } from "@/lib/cliniq-core/action-center/persistence-config"

import { buildExpectedActualComparisonFromRawRows } from "./build-expected-actual-comparison"
import type { ExpectedVsActualLine } from "./merge-expected-actual"
import { missingBillablesToActionCenterItems } from "./missing-billables-to-action-items"

const RECENT_LIMIT = 8

export type ExecutionLineState = {
  lineCode: string
  expectedQuantity: number
  expectedRevenue: number
  actualQuantity: number
  actualAmount: number
  quantityGap: number
  revenueGap: number
}

export type FinancialSeverity = "high" | "medium" | "low"

export type MissingExecutionLineState = ExecutionLineState & {
  severity: FinancialSeverity
  estimatedRevenueAtRisk: number
  priorityRank: number
}

export type RevenueLeakageRowState = {
  id: string
  recordId: string | null
  eventLogId: string | null
  leakageValue: number
  reason: string | null
}

/** Unified operational payload: API + UI (JSON-serializable, no undefined). */
export type ExecutionState = {
  ok: boolean
  studyKey: string
  error: string | null
  headline: {
    totalEvents: number
    totalExpectedBillables: number
    totalBillableInstances: number
  }
  totals: {
    expectedRevenue: number
    actualBillableAmount: number
    revenueGap: number
  }
  comparisonSummary: {
    matchedLineCount: number
    missingLineCount: number
    totalLineCount: number
  }
  lines: ExecutionLineState[]
  matched: ExecutionLineState[]
  missing: MissingExecutionLineState[]
  leakage: {
    missingRevenue: number
    missingLineCount: number
  }
  revenueLeakage: {
    data: RevenueLeakageRowState[]
    summary: { totalItems: number; totalValue: number }
    warnings: string[]
  }
  recent: {
    eventLog: Record<string, unknown>[]
    expectedBillables: Record<string, unknown>[]
    billableInstances: Record<string, unknown>[]
  }
  /** First visit_name seen per line_code (SoA alignment helper). */
  visitByLine: Record<string, string>
  actionCenterSync: {
    attempted: boolean
    upserted: number
    error: string | null
  }
}

function mapLine(l: ExpectedVsActualLine): ExecutionLineState {
  return {
    lineCode: l.line_code,
    expectedQuantity: l.expected_quantity,
    expectedRevenue: l.expected_revenue,
    actualQuantity: l.actual_quantity,
    actualAmount: l.actual_amount,
    quantityGap: l.quantity_gap,
    revenueGap: l.revenue_gap,
  }
}

function severityFromEstimatedAtRisk(estimatedAtRisk: number): FinancialSeverity {
  if (estimatedAtRisk >= 1000) return "high"
  if (estimatedAtRisk >= 250) return "medium"
  return "low"
}

function prioritizeMissing(lines: ExecutionLineState[]): MissingExecutionLineState[] {
  const enriched = lines.map((l) => {
    const estimatedRevenueAtRisk = Math.max(0, l.revenueGap)
    return {
      ...l,
      estimatedRevenueAtRisk,
      severity: severityFromEstimatedAtRisk(estimatedRevenueAtRisk),
      priorityRank: 0,
    }
  })

  enriched.sort((a, b) => {
    if (b.estimatedRevenueAtRisk !== a.estimatedRevenueAtRisk) {
      return b.estimatedRevenueAtRisk - a.estimatedRevenueAtRisk
    }
    return a.lineCode.localeCompare(b.lineCode)
  })

  return enriched.map((l, idx) => ({ ...l, priorityRank: idx + 1 }))
}

function emptyState(studyKey: string, error: string | null): ExecutionState {
  return {
    ok: false,
    studyKey,
    error,
    headline: { totalEvents: 0, totalExpectedBillables: 0, totalBillableInstances: 0 },
    totals: { expectedRevenue: 0, actualBillableAmount: 0, revenueGap: 0 },
    comparisonSummary: { matchedLineCount: 0, missingLineCount: 0, totalLineCount: 0 },
    lines: [],
    matched: [],
    missing: [],
    leakage: { missingRevenue: 0, missingLineCount: 0 },
    revenueLeakage: {
      data: [],
      summary: { totalItems: 0, totalValue: 0 },
      warnings: [],
    },
    recent: { eventLog: [], expectedBillables: [], billableInstances: [] },
    visitByLine: {},
    actionCenterSync: { attempted: false, upserted: 0, error: null },
  }
}

export type RunOperationalExecutionOptions = {
  /** When true, upserts missing-line items via Action Center Supabase adapter (requires persistence mode). */
  syncActionCenter?: boolean
}

/**
 * Single entry point for operational execution analysis (expected vs actual, leakage, recents).
 */
export async function runOperationalExecution(
  client: SupabaseClient,
  studyKey: string,
  options: RunOperationalExecutionOptions = {},
): Promise<ExecutionState> {
  const syncActionCenter = options.syncActionCenter === true

  if (!studyKey.trim()) {
    return { ...emptyState("", "study_key is required"), ok: false }
  }

  const [evC, exC, biC, evR, exR, biR, expFull, biFull] = await Promise.all([
    client.from("event_log").select("id", { count: "exact", head: true }).eq("study_id", studyKey),
    client.from("expected_billables").select("id", { count: "exact", head: true }).eq("study_id", studyKey),
    client.from("billable_instances").select("id", { count: "exact", head: true }).eq("execution_study_key", studyKey),
    client
      .from("event_log")
      .select("*")
      .eq("study_id", studyKey)
      .order("event_date", { ascending: false })
      .limit(RECENT_LIMIT),
    client.from("expected_billables").select("*").eq("study_id", studyKey).order("visit_name").limit(RECENT_LIMIT),
    client
      .from("billable_instances")
      .select("*")
      .eq("execution_study_key", studyKey)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    client.from("expected_billables").select("line_code, visit_name, expected_quantity, expected_revenue").eq("study_id", studyKey),
    client.from("billable_instances").select("fee_code, quantity, amount").eq("execution_study_key", studyKey),
  ])

  const err = evC.error ?? exC.error ?? biC.error ?? evR.error ?? exR.error ?? biR.error ?? expFull.error ?? biFull.error
  if (err) {
    return { ...emptyState(studyKey, err.message), ok: false }
  }

  const comp = buildExpectedActualComparisonFromRawRows(
    studyKey,
    (expFull.data ?? []) as Record<string, unknown>[],
    (biFull.data ?? []) as Record<string, unknown>[],
  )

  const lines = comp.lines.map(mapLine)
  const matched = comp.matched.map(mapLine)
  const missing = prioritizeMissing(comp.missing.map(mapLine))

  const totals = comp.lines.reduce(
    (acc, row) => {
      acc.expectedRevenue += row.expected_revenue
      acc.actualBillableAmount += row.actual_amount
      acc.revenueGap += row.revenue_gap
      return acc
    },
    { expectedRevenue: 0, actualBillableAmount: 0, revenueGap: 0 },
  )

  const revenueLeakageData: RevenueLeakageRowState[] = comp.revenueLeakage.data.map((r) => ({
    id: r.id,
    recordId: r.recordId ?? null,
    eventLogId: r.eventLogId ?? null,
    leakageValue: r.leakageValue,
    reason: r.reason ?? null,
  }))

  let actionCenterSync: ExecutionState["actionCenterSync"] = {
    attempted: false,
    upserted: 0,
    error: null,
  }

  if (syncActionCenter) {
    if (!isSupabasePersistenceEnabled()) {
      actionCenterSync = {
        attempted: true,
        upserted: 0,
        error: "CLINIQ_ACTION_CENTER_PERSISTENCE_MODE must be supabase",
      }
    } else {
      try {
        const items = missingBillablesToActionCenterItems(studyKey, comp.missing, comp.visitByLine)
        await getActionCenterPersistenceAdapter().upsertActionItems(items)
        actionCenterSync = { attempted: true, upserted: items.length, error: null }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        actionCenterSync = { attempted: true, upserted: 0, error: msg }
      }
    }
  }

  return {
    ok: true,
    studyKey,
    error: null,
    headline: {
      totalEvents: evC.count ?? 0,
      totalExpectedBillables: exC.count ?? 0,
      totalBillableInstances: biC.count ?? 0,
    },
    totals,
    comparisonSummary: {
      matchedLineCount: comp.summary.matched_line_count,
      missingLineCount: comp.summary.missing_line_count,
      totalLineCount: comp.summary.total_line_count,
    },
    lines,
    matched,
    missing,
    leakage: {
      missingRevenue: comp.leakage.missing_revenue,
      missingLineCount: comp.leakage.missing_line_count,
    },
    revenueLeakage: {
      data: revenueLeakageData,
      summary: {
        totalItems: comp.revenueLeakage.summary.totalItems,
        totalValue: comp.revenueLeakage.summary.totalValue,
      },
      warnings: [...comp.revenueLeakage.warnings],
    },
    recent: {
      eventLog: (evR.data ?? []) as Record<string, unknown>[],
      expectedBillables: (exR.data ?? []) as Record<string, unknown>[],
      billableInstances: (biR.data ?? []) as Record<string, unknown>[],
    },
    visitByLine: Object.fromEntries(comp.visitByLine),
    actionCenterSync,
  }
}
