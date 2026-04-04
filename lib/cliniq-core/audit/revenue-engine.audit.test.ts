import { describe, expect, it } from "vitest"

import { analyzeSoABudgetGap } from "../analysis/soa-budget-gap"
import { buildRevenueDecision } from "../analysis/revenue-decision"
import { buildNegotiationActions } from "../analysis/negotiation-engine"
import {
  projectRevenue,
  type BudgetLineItem,
  type SiteCostProfile,
  type SoAActivity,
} from "../analysis/revenue-projection"
import { summarizeRevenueCoverage } from "../analysis/revenue-coverage-summary"

const AUDIT_SITE_COST_PROFILE: SiteCostProfile = {
  overheadMultiplier: 1.25,
  targetMarginPercent: 0.35,
  stretchMarginPercent: 0.6,
}

type PipelineResult = ReturnType<typeof runFullRevenuePipeline>

function runFullRevenuePipeline(soa: SoAActivity[], budget: BudgetLineItem[]) {
  const gap = analyzeSoABudgetGap({ soa, budget })
  const projection = projectRevenue({ soa, budget, siteCostProfile: AUDIT_SITE_COST_PROFILE })
  const coverage = summarizeRevenueCoverage({ projection })
  const { actions: negotiationActions } = buildNegotiationActions({ coverageSummary: coverage })
  const decision = buildRevenueDecision({
    gap,
    projection,
    coverage,
    negotiation: negotiationActions,
  })
  return { gap, projection, coverage, negotiationActions, decision }
}

function collectNumbers(value: unknown, out: number[] = []): number[] {
  if (value === null || value === undefined) return out
  if (typeof value === "number") {
    out.push(value)
    return out
  }
  if (typeof value === "string" || typeof value === "boolean") return out
  if (Array.isArray(value)) {
    for (const x of value) collectNumbers(x, out)
    return out
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) collectNumbers(v, out)
  }
  return out
}

function assertGlobalInvariants(p: PipelineResult): void {
  const nums = collectNumbers(p)
  for (const n of nums) {
    expect(Number.isNaN(n)).toBe(false)
    expect(Number.isFinite(n)).toBe(true)
    expect(n).toBeGreaterThanOrEqual(0)
  }

  const { matchedRevenue, uncoveredRevenue, totalProjectedRevenue } = p.projection.summary
  expect(matchedRevenue + uncoveredRevenue).toBe(totalProjectedRevenue)

  expect(p.coverage.coverage.coveragePercent).toBeGreaterThanOrEqual(0)
  expect(p.coverage.coverage.coveragePercent).toBeLessThanOrEqual(100)
  expect(p.coverage.coverage.uncoveredPercent).toBeGreaterThanOrEqual(0)
  expect(p.coverage.coverage.uncoveredPercent).toBeLessThanOrEqual(100)

  expect(p.decision.topActions.length).toBeLessThanOrEqual(3)
  expect(["SAFE", "MODERATE_RISK", "HIGH_RISK"]).toContain(p.decision.decision)
}

function assertDeterministic(soa: SoAActivity[], budget: BudgetLineItem[]): void {
  const a = runFullRevenuePipeline(soa, budget)
  const b = runFullRevenuePipeline(soa, budget)
  expect(JSON.stringify(a.projection)).toBe(JSON.stringify(b.projection))
  expect(JSON.stringify(a.coverage)).toBe(JSON.stringify(b.coverage))
  expect(JSON.stringify(a.negotiationActions)).toBe(JSON.stringify(b.negotiationActions))
  expect(JSON.stringify(a.decision)).toBe(JSON.stringify(b.decision))
  expect(JSON.stringify(a.gap)).toBe(JSON.stringify(b.gap))
}

describe("revenue engine audit", () => {
  it("CASE 1 — Perfect Match: full coverage, SAFE, no gap", () => {
    const soa: SoAActivity[] = [
      { name: "Blood draw", visit: "V1", isBillable: true },
    ]
    const budget: BudgetLineItem[] = [{ description: "Blood draw", amount: 200 }]

    const p = runFullRevenuePipeline(soa, budget)

    expect(p.gap.missingInBudget).toHaveLength(0)
    expect(p.projection.summary.uncoveredRevenue).toBe(0)
    expect(p.projection.summary.uncoveredCount).toBe(0)
    expect(p.coverage.coverage.coveragePercent).toBe(100)
    expect(p.decision.decision).toBe("SAFE")
    expect(p.decision.revenueAtRisk).toBe(0)

    assertGlobalInvariants(p)
    assertDeterministic(soa, budget)
  })

  it("CASE 2 — Partial Coverage: missing billable, not SAFE", () => {
    const soa: SoAActivity[] = [
      { name: "Blood draw", visit: "V1", isBillable: true },
      { name: "ECG", visit: "V1", isBillable: true },
    ]
    const budget: BudgetLineItem[] = [{ description: "Blood draw", amount: 200 }]

    const p = runFullRevenuePipeline(soa, budget)

    expect(p.gap.missingInBudget).toHaveLength(1)
    expect(p.projection.summary.uncoveredRevenue).toBeGreaterThan(0)
    expect(p.coverage.coverage.coveragePercent).toBeLessThan(100)
    expect(p.decision.decision).not.toBe("SAFE")

    assertGlobalInvariants(p)
    assertDeterministic(soa, budget)
  })

  it("CASE 3 — No Budget: zero projection, gap empty, does not crash", () => {
    const soa: SoAActivity[] = [{ name: "Blood draw", visit: "V1", isBillable: true }]
    const budget: BudgetLineItem[] = []

    expect(() => runFullRevenuePipeline(soa, budget)).not.toThrow()

    const p = runFullRevenuePipeline(soa, budget)

    expect(p.projection.summary.totalProjectedRevenue).toBe(0)
    expect(p.gap.missingInBudget).toHaveLength(0)
    expect(p.gap.potentialRevenueLoss).toBe(0)
    expect(p.coverage.summaryText).toBe("No projected billable revenue is available to summarize.")

    assertGlobalInvariants(p)
    assertDeterministic(soa, budget)
  })

  it("CASE 4 — Duplicate budget lines: single match, no double-counted matched revenue", () => {
    const soa: SoAActivity[] = [{ name: "Blood draw", visit: "V1", isBillable: true }]
    const budget: BudgetLineItem[] = [
      { description: "Blood draw", amount: 200 },
      { description: "Blood draw", amount: 200 },
    ]

    const p = runFullRevenuePipeline(soa, budget)

    expect(p.projection.matchedBillables).toHaveLength(1)
    expect(p.projection.summary.matchedRevenue).toBe(200)
    expect(p.projection.summary.totalProjectedRevenue).toBe(200)

    assertGlobalInvariants(p)
    assertDeterministic(soa, budget)
  })

  it("CASE 5 — Text noise: case-insensitive match", () => {
    const soa: SoAActivity[] = [{ name: "Blood Draw", visit: "V1", isBillable: true }]
    const budget: BudgetLineItem[] = [{ description: "BLOOD DRAW", amount: 200 }]

    const p = runFullRevenuePipeline(soa, budget)

    expect(p.projection.matchedBillables).toHaveLength(1)
    expect(p.projection.summary.uncoveredCount).toBe(0)
    expect(p.gap.missingInBudget).toHaveLength(0)

    assertGlobalInvariants(p)
    assertDeterministic(soa, budget)
  })

  it("CASE 6 — High leakage: five billables, one budget line → HIGH_RISK", () => {
    // Names avoid substring hits on pricing aliases (e.g. "Proc A" contains "pro" → questionnaire).
    const soa: SoAActivity[] = [
      { name: "Qx1", visit: "V1", isBillable: true },
      { name: "Qx2", visit: "V1", isBillable: true },
      { name: "Qx3", visit: "V1", isBillable: true },
      { name: "Qx4", visit: "V1", isBillable: true },
      { name: "Qx5", visit: "V1", isBillable: true },
    ]
    const budget: BudgetLineItem[] = [{ description: "Unrelated single line", amount: 1000 }]

    const p = runFullRevenuePipeline(soa, budget)

    expect(p.projection.summary.matchedRevenue).toBe(0)
    // Five fallbacks at blended table average × site profile; sum stays under 2× budget cap.
    expect(p.projection.summary.uncoveredRevenue).toBe(1695)
    expect(p.projection.summary.totalProjectedRevenue).toBe(1695)
    expect(p.decision.decision).toBe("HIGH_RISK")

    assertGlobalInvariants(p)
    assertDeterministic(soa, budget)
  })

  it("negotiation actions align with coverage priority items (count and impacts)", () => {
    const soa: SoAActivity[] = [
      { name: "A", visit: "V1", isBillable: true },
      { name: "B", visit: "V1", isBillable: true },
    ]
    const budget: BudgetLineItem[] = [{ description: "Z only", amount: 100 }]

    const p = runFullRevenuePipeline(soa, budget)
    expect(p.negotiationActions.length).toBe(p.coverage.priorityItems.length)
    for (let i = 0; i < p.negotiationActions.length; i++) {
      expect(p.negotiationActions[i].impact).toBe(p.coverage.priorityItems[i].impact)
    }
    assertGlobalInvariants(p)
  })
})
