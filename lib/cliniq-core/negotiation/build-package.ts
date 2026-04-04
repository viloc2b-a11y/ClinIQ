import {
  buildDefensiveJustifications,
  supportingFactsForCategory,
} from "./justifications"
import { recommendPaymentTerms } from "./payment-terms"
import type {
  BuildNegotiationPackageParams,
  CounterofferLine,
  NegotiationPackage,
  NegotiationStrategy,
} from "./types"
import type { NegotiationEngineGapLine } from "../budget-gap/negotiation-input"
import type { BudgetGapSummary } from "../budget-gap/types"

function roundMoney(n: number): number {
  return Math.round(n)
}

export function recommendCounterofferForLine(
  line: NegotiationEngineGapLine,
  strategy: NegotiationStrategy,
  summary: BudgetGapSummary,
): CounterofferLine | null {
  const internalCost = line.internalTotal
  const sponsorOffer = line.sponsorTotalOffer
  const gapAmount = line.gapAmount
  const priority = line.negotiationPriority

  if (line.status === "missing") {
    const recommendedCounteroffer = roundMoney(internalCost)
    return {
      lineCode: line.lineCode,
      label: line.label,
      category: line.category,
      visitName: line.visitName,
      sponsorOffer,
      internalCost,
      recommendedCounteroffer,
      gapAmount,
      priority: "high",
      rationale:
        "Sponsor budget omits this activity; we request an explicit line item at modeled internal cost.",
      supportingFacts: supportingFactsForCategory(line.category, line.label),
      riskFlag: true,
    }
  }

  if (line.status === "loss") {
    const absGap = Math.abs(gapAmount)
    let recommended: number
    if (strategy === "conservative") {
      recommended = roundMoney(sponsorOffer + 0.35 * absGap)
      recommended = Math.min(recommended, internalCost)
    } else if (strategy === "balanced") {
      const towardHealthy = roundMoney(internalCost * 1.05)
      const bridge = roundMoney(sponsorOffer + 0.65 * absGap)
      recommended = Math.max(bridge, towardHealthy)
      recommended = Math.min(recommended, roundMoney(internalCost * 1.12))
    } else {
      recommended = Math.max(sponsorOffer, roundMoney(internalCost * 1.08))
    }
    recommended = Math.max(recommended, sponsorOffer)
    return {
      lineCode: line.lineCode,
      label: line.label,
      category: line.category,
      visitName: line.visitName,
      sponsorOffer,
      internalCost,
      recommendedCounteroffer: recommended,
      gapAmount,
      priority,
      rationale:
        strategy === "conservative"
          ? "Partial recovery toward modeled cost while preserving relationship bandwidth."
          : strategy === "balanced"
            ? "Adjustment targets sustainable delivery economics closer to a healthy margin band."
            : "Adjustment aligns sponsor fees with modeled cost and inspection-ready execution.",
      supportingFacts: supportingFactsForCategory(line.category, line.label),
      riskFlag: absGap >= 5000 || summary.negativeCashFlowRisk,
    }
  }

  if (line.status === "breakeven") {
    if (strategy === "conservative") return null
    const bump =
      strategy === "balanced"
        ? summary.negativeCashFlowRisk
          ? roundMoney(internalCost * 1.03)
          : null
        : roundMoney(internalCost * 1.05)
    if (bump === null || bump <= sponsorOffer) return null
    return {
      lineCode: line.lineCode,
      label: line.label,
      category: line.category,
      visitName: line.visitName,
      sponsorOffer,
      internalCost,
      recommendedCounteroffer: bump,
      gapAmount,
      priority: "medium",
      rationale:
        "Thin headroom on this line; modest increase supports consistent staffing through the study.",
      supportingFacts: supportingFactsForCategory(line.category, line.label),
      riskFlag: !!summary.negativeCashFlowRisk,
    }
  }

  if (line.status === "profitable") {
    if (strategy !== "firm") return null
    const stretch = roundMoney(internalCost * 1.04)
    if (stretch <= sponsorOffer) return null
    return {
      lineCode: line.lineCode,
      label: line.label,
      category: line.category,
      visitName: line.visitName,
      sponsorOffer,
      internalCost,
      recommendedCounteroffer: stretch,
      gapAmount,
      priority: "low",
      rationale:
        "Strategic alignment pass: minor uplift on a currently positive line to offset concentrated shortfalls elsewhere.",
      supportingFacts: supportingFactsForCategory(line.category, line.label),
      riskFlag: false,
    }
  }

  return null
}

export function selectLinesForStrategy(
  lines: NegotiationEngineGapLine[],
  strategy: NegotiationStrategy,
  summary: BudgetGapSummary,
): NegotiationEngineGapLine[] {
  const sortedLoss = lines
    .filter((l) => l.status === "loss")
    .slice()
    .sort((a, b) => a.gapAmount - b.gapAmount)

  const missing = lines.filter((l) => l.status === "missing")

  if (strategy === "conservative") {
    const deepLoss = sortedLoss.filter((l) => Math.abs(l.gapAmount) >= 5000)
    const extra = sortedLoss
      .filter((l) => Math.abs(l.gapAmount) < 5000)
      .slice(0, 3)
    const picked = new Map<string, NegotiationEngineGapLine>()
    for (const l of [...missing, ...deepLoss, ...extra]) picked.set(l.id, l)
    return Array.from(picked.values())
  }

  if (strategy === "balanced") {
    const breakeven = lines.filter(
      (l) => l.status === "breakeven" && summary.negativeCashFlowRisk,
    )
    const picked = new Map<string, NegotiationEngineGapLine>()
    for (const l of [...missing, ...sortedLoss, ...breakeven]) picked.set(l.id, l)
    return Array.from(picked.values())
  }

  const breakevenAll = lines.filter((l) => l.status === "breakeven")
  const profitable = lines.filter((l) => l.status === "profitable")
  const picked = new Map<string, NegotiationEngineGapLine>()
  for (const l of [...missing, ...sortedLoss, ...breakevenAll, ...profitable]) {
    picked.set(l.id, l)
  }
  return Array.from(picked.values())
}

function sortSelectedLines(
  lines: NegotiationEngineGapLine[],
): NegotiationEngineGapLine[] {
  const statusRank: Record<string, number> = {
    missing: 0,
    loss: 1,
    breakeven: 2,
    profitable: 3,
  }
  return lines.slice().sort((a, b) => {
    const ra = statusRank[a.status] ?? 9
    const rb = statusRank[b.status] ?? 9
    if (ra !== rb) return ra - rb
    return a.gapAmount - b.gapAmount
  })
}

function dedupeJustifications<T extends { rationale: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const j of items) {
    if (seen.has(j.rationale)) continue
    seen.add(j.rationale)
    out.push(j)
  }
  return out
}

/**
 * End-to-end: Module 3 input → structured negotiation package (pure).
 */
export function buildNegotiationPackage(
  params: BuildNegotiationPackageParams,
): NegotiationPackage {
  const { input, strategy } = params
  const selected = sortSelectedLines(
    selectLinesForStrategy(input.lines, strategy, input.summary),
  )

  const counterofferLines: CounterofferLine[] = []
  for (const line of selected) {
    const row = recommendCounterofferForLine(line, strategy, input.summary)
    if (row) counterofferLines.push(row)
  }

  const categoriesTouched = [
    ...new Set(counterofferLines.map((c) => c.category)),
  ]
  const hasMissingCritical = input.missingInvoiceables.length > 0

  const justifications = dedupeJustifications(
    buildDefensiveJustifications({
      categoriesTouched,
      negativeCashFlowRisk: input.summary.negativeCashFlowRisk,
      hasMissingCritical,
    }),
  )

  const paymentTerms = recommendPaymentTerms(input)

  return {
    schemaVersion: "1.0",
    strategy,
    generatedAt: new Date().toISOString(),
    studyId: input.studyMeta.studyId,
    studyName: input.studyMeta.studyName,
    siteName: input.studyMeta.siteName,
    counterofferLines,
    justifications,
    paymentTerms,
    summarySnapshot: {
      totalInternal: input.summary.totalInternalRevenue,
      totalSponsor: input.summary.totalSponsorRevenue,
      totalGap: input.summary.totalGap,
      negativeCashFlowRisk: input.summary.negativeCashFlowRisk,
      decision: input.decision,
    },
  }
}
