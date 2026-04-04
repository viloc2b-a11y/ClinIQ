import { determineBudgetDecision, type BudgetDecision } from "./budget-decision"
import type {
  BudgetGapResult,
  BudgetGapSummary,
  BudgetStudyMeta,
  GapStatus,
  MissingInvoiceable,
} from "./types"

export type NegotiationPriority = "high" | "medium" | "low"

export type NegotiationTargetKind = "loss" | "missing"

export type NegotiationTarget = {
  id: string
  kind: NegotiationTargetKind
  lineCode: string
  label: string
  category: string
  visitName: string
  quantity: number
  unit: string
  internalTotal: number
  sponsorTotalOffer: number
  gapAmount: number
  reason: string
  /** Source line notes for sponsor-facing justification in Module 4 package. */
  notes?: string
}

export type NegotiationEngineGapLine = {
  id: string
  lineCode: string
  label: string
  category: string
  visitName: string
  quantity: number
  unit: string
  internalTotal: number
  sponsorTotalOffer: number
  gapAmount: number
  gapPercent: number
  status: GapStatus
  negotiationPriority: NegotiationPriority
}

/** Pre-award negotiation payload; no runtime events or persistence in this layer. */
export type NegotiationEngineInput = {
  schemaVersion: "1.0"
  generatedAt: string
  studyMeta: BudgetStudyMeta
  decision: BudgetDecision
  summary: BudgetGapSummary
  lines: NegotiationEngineGapLine[]
  missingInvoiceables: MissingInvoiceable[]
  topNegotiationTargets: NegotiationTarget[]
  justificationPoints: string[]
  risk: {
    negativeCashFlowRisk: boolean
    primaryAlerts: string[]
  }
}

function negotiationPriorityForStatus(status: GapStatus): NegotiationPriority {
  if (status === "missing" || status === "loss") return "high"
  if (status === "breakeven") return "medium"
  return "low"
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

/**
 * Missing invoiceables first, then up to five deepest loss lines (by gap amount).
 */
export function buildTopNegotiationTargets(
  result: BudgetGapResult,
): NegotiationTarget[] {
  const missing: NegotiationTarget[] = result.missingInvoiceables.map((m) => ({
    id: m.id,
    kind: "missing",
    lineCode: m.lineCode,
    label: m.label,
    category: m.category,
    visitName: m.visitName,
    quantity: m.quantity,
    unit: m.unit,
    internalTotal: m.internalTotal,
    sponsorTotalOffer: 0,
    gapAmount: m.gapAmount,
    notes: m.notes,
    reason:
      "No sponsor line item; internal model includes required workload for GCP documentation, monitoring prep, and audit trail.",
  }))

  const losses = result.gapLines
    .filter((l) => l.status === "loss")
    .slice()
    .sort((a, b) => a.gapAmount - b.gapAmount)
    .slice(0, 5)
    .map(
      (l): NegotiationTarget => ({
        id: l.id,
        kind: "loss",
        lineCode: l.lineCode,
        label: l.label,
        category: l.category,
        visitName: l.visitName,
        quantity: l.quantity,
        unit: l.unit,
        internalTotal: l.internalTotal,
        sponsorTotalOffer: l.sponsorTotalOffer,
        gapAmount: l.gapAmount,
        notes: l.notes,
        reason: `Sponsor offer trails modeled cost by ${fmtPct(-l.gapAmount / Math.max(l.internalTotal, 1e-9))} on this activity.`,
      }),
    )

  return [...missing, ...losses]
}

export function buildJustificationPoints(
  result: BudgetGapResult,
  summary: BudgetGapSummary,
  decision: BudgetDecision,
): string[] {
  const points: string[] = []
  const internal = summary.totalInternalRevenue

  if (internal > 0 && summary.totalGap < 0) {
    const shortfallPct = (-summary.totalGap / internal) * 100
    points.push(
      `Compared lines are ${shortfallPct.toFixed(1)}% below our internal modeled cost (${Math.round(summary.totalSponsorRevenue)} offered vs ${Math.round(internal)} required).`,
    )
  }

  if (result.missingInvoiceables.length > 0) {
    points.push(
      `${result.missingInvoiceables.length} critical invoiceable(s) are absent from the sponsor grid while still required for compliant conduct (delegation, source/IP accountability, lab/specimen handling, and query resolution).`,
    )
  }

  const lossCount = result.gapLines.filter((l) => l.status === "loss").length
  if (lossCount > 0) {
    points.push(
      `${lossCount} activity line(s) are underwater versus true staffing, coordinator/PI oversight, and visit execution time.`,
    )
  }

  if (summary.negativeCashFlowRisk) {
    points.push(
      "Cash-flow and delivery risk are elevated: the mix of omitted fees and underwater visits threatens timeline adherence and inspection readiness.",
    )
  }

  if (decision === "accept") {
    points.push(
      "Blended margin meets the 10% accept band on this snapshot; countersignature can proceed if contract matches these economics.",
    )
  } else if (decision === "negotiate") {
    points.push(
      "Shortfall is within a recoverable band; targeted per-line increases restore sustainability without expanding protocol scope.",
    )
  } else {
    points.push(
      "Aggregate economics fall outside site guardrails; a revised budget is required before activation and patient exposure.",
    )
  }

  points.push(
    "Increases reflect workload, not margin stacking: they cover monitored visits, pharmacy/lab logistics, regulatory binder quality, and sponsor query cycles.",
  )

  return points
}

/**
 * Pure bridge payload for Module 4 (negotiation / counteroffer engine).
 */
export function budgetGapResultToNegotiationEngineInput(
  result: BudgetGapResult,
  studyMeta: BudgetStudyMeta,
  options?: { generatedAt?: string },
): NegotiationEngineInput {
  const generatedAt = options?.generatedAt ?? new Date().toISOString()
  const decision = determineBudgetDecision(result.summary)
  const topNegotiationTargets = buildTopNegotiationTargets(result)
  const justificationPoints = buildJustificationPoints(
    result,
    result.summary,
    decision,
  )

  return {
    schemaVersion: "1.0",
    generatedAt,
    studyMeta,
    decision,
    summary: result.summary,
    lines: result.gapLines.map((l) => ({
      id: l.id,
      lineCode: l.lineCode,
      label: l.label,
      category: l.category,
      visitName: l.visitName,
      quantity: l.quantity,
      unit: l.unit,
      internalTotal: l.internalTotal,
      sponsorTotalOffer: l.sponsorTotalOffer,
      gapAmount: l.gapAmount,
      gapPercent: l.gapPercent,
      status: l.status,
      negotiationPriority: negotiationPriorityForStatus(l.status),
    })),
    missingInvoiceables: result.missingInvoiceables,
    topNegotiationTargets,
    justificationPoints,
    risk: {
      negativeCashFlowRisk: result.summary.negativeCashFlowRisk,
      primaryAlerts: [...result.summary.primaryAlerts],
    },
  }
}
