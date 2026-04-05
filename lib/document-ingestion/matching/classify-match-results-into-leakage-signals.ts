/**
 * Document Engine v1 — deterministic leakage-style signals from strict match results (no Action Center).
 */

export type MatchResult = {
  matched: Array<{
    expectedIndex: number
    invoiceIndex: number
    matchKey: string
    quantityMatch: boolean
    unitPriceMatch: boolean
    totalPriceMatch: boolean
    status: "matched" | "partial_mismatch"
    differences: string[]
  }>
  unmatchedExpected: Array<{
    expectedIndex: number
    reason: string
    matchKey: string
  }>
  unmatchedInvoice: Array<{
    invoiceIndex: number
    reason: string
    matchKey: string
  }>
  summary: {
    totalExpected: number
    totalInvoice: number
    matchedCount: number
    partialMismatchCount: number
    unmatchedExpectedCount: number
    unmatchedInvoiceCount: number
  }
  warnings: string[]
}

export type LeakageSignalType =
  | "missing_invoice"
  | "unexpected_invoice"
  | "quantity_mismatch"
  | "unit_price_mismatch"
  | "total_price_mismatch"
  | "incomplete_comparison"

export type LeakageSeverity = "low" | "medium" | "high"

export type LeakageSignal = {
  signalType: LeakageSignalType
  severity: LeakageSeverity
  expectedIndex: number | null
  invoiceIndex: number | null
  matchKey: string
  reasons: string[]
  sourceStatus: "unmatched_expected" | "unmatched_invoice" | "partial_mismatch"
}

export type ClassifyLeakageSummary = {
  totalSignals: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  highSeverityCount: number
  mediumSeverityCount: number
  lowSeverityCount: number
}

export type ClassifyMatchResultsIntoLeakageSignalsResult = {
  signals: LeakageSignal[]
  summary: ClassifyLeakageSummary
  warnings: string[]
}

const NO_SIGNALS_WARNING = "No leakage signals detected."

function mapDifferenceToSignal(
  diff: string,
): { signalType: LeakageSignalType; severity: LeakageSeverity } | null {
  switch (diff) {
    case "Quantity mismatch":
      return { signalType: "quantity_mismatch", severity: "medium" }
    case "Unit price mismatch":
      return { signalType: "unit_price_mismatch", severity: "high" }
    case "Total price mismatch":
      return { signalType: "total_price_mismatch", severity: "high" }
    case "Missing comparable quantity":
    case "Missing comparable unitPrice":
    case "Missing comparable totalPrice":
      return { signalType: "incomplete_comparison", severity: "low" }
    default:
      return null
  }
}

export function pushSignal(
  signals: LeakageSignal[],
  signal: LeakageSignal,
): void {
  signals.push(signal)
}

export function countByType(signals: LeakageSignal[]): Record<string, number> {
  const m = new Map<string, number>()
  for (const s of signals) {
    m.set(s.signalType, (m.get(s.signalType) ?? 0) + 1)
  }
  const keys = [...m.keys()].sort((a, b) => a.localeCompare(b))
  const out: Record<string, number> = {}
  for (const k of keys) {
    out[k] = m.get(k) ?? 0
  }
  return out
}

const SEVERITY_KEYS = ["high", "low", "medium"] as const

export function countBySeverity(signals: LeakageSignal[]): Record<string, number> {
  const m = new Map<string, number>()
  for (const sev of SEVERITY_KEYS) {
    m.set(sev, 0)
  }
  for (const s of signals) {
    m.set(s.severity, (m.get(s.severity) ?? 0) + 1)
  }
  const out: Record<string, number> = {}
  for (const sev of SEVERITY_KEYS) {
    out[sev] = m.get(sev) ?? 0
  }
  return out
}

function buildSummary(signals: LeakageSignal[]): ClassifyLeakageSummary {
  return {
    totalSignals: signals.length,
    byType: countByType(signals),
    bySeverity: countBySeverity(signals),
    highSeverityCount: signals.filter((s) => s.severity === "high").length,
    mediumSeverityCount: signals.filter((s) => s.severity === "medium").length,
    lowSeverityCount: signals.filter((s) => s.severity === "low").length,
  }
}

/**
 * Turn strict matcher output into ordered, explainable leakage-style signals.
 */
export function classifyMatchResultsIntoLeakageSignals(input: {
  matchResult: MatchResult
}): ClassifyMatchResultsIntoLeakageSignalsResult {
  const { matchResult } = input
  const signals: LeakageSignal[] = []

  for (const u of matchResult.unmatchedExpected) {
    pushSignal(signals, {
      signalType: "missing_invoice",
      severity: "high",
      expectedIndex: u.expectedIndex,
      invoiceIndex: null,
      matchKey: u.matchKey,
      reasons: ["No invoice match found"],
      sourceStatus: "unmatched_expected",
    })
  }

  for (const u of matchResult.unmatchedInvoice) {
    pushSignal(signals, {
      signalType: "unexpected_invoice",
      severity: "medium",
      expectedIndex: null,
      invoiceIndex: u.invoiceIndex,
      matchKey: u.matchKey,
      reasons: ["No expected match found"],
      sourceStatus: "unmatched_invoice",
    })
  }

  for (const m of matchResult.matched) {
    if (m.status !== "partial_mismatch") continue
    for (const diff of m.differences) {
      const mapped = mapDifferenceToSignal(diff)
      if (mapped === null) continue
      pushSignal(signals, {
        signalType: mapped.signalType,
        severity: mapped.severity,
        expectedIndex: m.expectedIndex,
        invoiceIndex: m.invoiceIndex,
        matchKey: m.matchKey,
        reasons: [diff],
        sourceStatus: "partial_mismatch",
      })
    }
  }

  const warnings = [...matchResult.warnings]
  if (signals.length === 0) {
    warnings.push(NO_SIGNALS_WARNING)
  }

  return {
    signals,
    summary: buildSummary(signals),
    warnings,
  }
}
