import { describe, expect, it } from "vitest"

import { buildClaimItemsFromRecords } from "../claims/build-claim-items-from-records"
import { buildInvoicePackagesFromClaims } from "../invoicing/build-invoice-packages"
import type { BillableInstance } from "../post-award-ledger/types"
import { computeRevenueLeakage } from "./compute-revenue-leakage"
import { prioritizeRevenueActions } from "./prioritize-revenue-actions"
import { buildRevenueDashboardSnapshot } from "./revenue-dashboard-snapshot"
import { computeRevenueProtectionScore } from "./revenue-protection-score"

describe("STEP 82 — Revenue Protection Score + Prioritization", () => {
  it("score should be < 100 when leakage exists", () => {
    const result = computeRevenueProtectionScore({
      invoices: { summary: { totalAmount: 1000 } },
      leakage: { summary: { totalValue: 500 } },
    })

    expect(result.score).toBeLessThan(100)
    expect(result.score).toBe(67)
    expect(result.summary.score).toBe(result.score)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it("score is 100 when no opportunity (no captured, no at-risk)", () => {
    const result = computeRevenueProtectionScore({
      invoices: { summary: { totalAmount: 0 } },
      leakage: { summary: { totalValue: 0 } },
    })
    expect(result.score).toBe(100)
    expect(result.warnings).toEqual([])
  })

  it("prioritizes by dollar impact; ties broken by id (deterministic)", () => {
    const result = prioritizeRevenueActions({
      actionItems: [
        { id: "b", leakageValue: 100, recordId: "r-b" },
        { id: "a", leakageValue: 100, recordId: "r-a" },
        { id: "c", leakageValue: 300, eventLogId: "e-c" },
      ],
    })
    expect(result.prioritizedActions.map((x) => x.id)).toEqual(["c", "a", "b"])
    expect(result.summary.highestValue).toBe(300)
    expect(result.summary.total).toBe(3)
    expect(result.prioritizedActions[0]!.recordId).toBeUndefined()
    expect(result.prioritizedActions[0]!.eventLogId).toBe("e-c")
  })

  it("uses estimatedValue when provided (over leakageValue)", () => {
    const result = prioritizeRevenueActions({
      actionItems: [
        { id: "x", leakageValue: 999, estimatedValue: 50 },
      ],
    })
    expect(result.prioritizedActions[0]!.priorityScore).toBe(50)
  })

  it("end-to-end with STEP 81 shapes: dashboard + consolidated JSON shape", () => {
    const records: BillableInstance[] = [
      {
        id: "bill-0",
        eventLogId: "evt-0",
        studyId: "S1",
        lineCode: "L0",
        label: "x",
        category: "visits",
        quantity: 1,
        unitAmount: 9800,
        totalAmount: 9800,
        occurredAt: "2026-04-01T12:00:00.000Z",
      },
    ]
    const claims = buildClaimItemsFromRecords({ records })
    const invoices = buildInvoicePackagesFromClaims({ claimItems: claims.data })
    const actionItems = [
      { id: "leak-0", recordId: "bill-0", eventLogId: "evt-0", leakageValue: 2650 },
    ]
    const leakage = computeRevenueLeakage({ actionItems })
    const score = computeRevenueProtectionScore({ invoices, leakage })
    const prioritized = prioritizeRevenueActions({ actionItems })

    expect(score.summary.score).toBe(
      Math.round((invoices.summary.totalAmount / (invoices.summary.totalAmount + leakage.summary.totalValue)) * 100),
    )

    const dashboard = buildRevenueDashboardSnapshot({
      invoices,
      leakage,
      score,
      prioritizedActions: prioritized,
    })

    expect(dashboard.summary.captured).toBe(invoices.summary.totalAmount)
    expect(dashboard.summary.atRisk).toBe(leakage.summary.totalValue)
    expect(dashboard.summary.score).toBe(score.score)
    expect(dashboard.data.topActions[0]!.id).toBe("leak-0")

    const consolidated = {
      score: { summary: score.summary },
      prioritized: { summary: prioritized.summary },
      dashboard: { summary: dashboard.summary },
    }
    expect(consolidated.score.summary.score).toBe(score.score)
    expect(consolidated.prioritized.summary.total).toBe(1)
    expect(consolidated.dashboard.summary).toEqual({
      captured: invoices.summary.totalAmount,
      atRisk: leakage.summary.totalValue,
      score: score.score,
    })
  })
})
