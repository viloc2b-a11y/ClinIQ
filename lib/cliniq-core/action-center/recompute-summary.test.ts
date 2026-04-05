import { describe, expect, it } from "vitest"

import { recomputeActionCenterSummary } from "./recompute-summary"
import type { ActionCenterItem } from "./types"

function base(overrides: Partial<ActionCenterItem> = {}): ActionCenterItem {
  return {
    id: "1",
    studyId: "S",
    subjectId: "SUB",
    visitName: "V",
    lineCode: "L",
    actionType: "prepare_invoice",
    ownerRole: "billing",
    priority: "medium",
    status: "open",
    title: "T",
    description: "D",
    expectedAmount: 10,
    invoicedAmount: 0,
    missingAmount: 10,
    leakageStatus: "missing",
    leakageReason: "not_invoiced",
    ...overrides,
  }
}

describe("recomputeActionCenterSummary", () => {
  it("empty list → zeros and empty breakdowns", () => {
    expect(recomputeActionCenterSummary([])).toEqual({
      totalOpen: 0,
      totalHighPriority: 0,
      totalMissingAmount: 0,
      byOwnerRole: {},
      byActionType: {},
    })
  })

  it("excludes resolved from all aggregates; keeps resolved-only list at zero", () => {
    const items = [base({ id: "a", status: "resolved", missingAmount: 999 })]
    expect(recomputeActionCenterSummary(items)).toEqual({
      totalOpen: 0,
      totalHighPriority: 0,
      totalMissingAmount: 0,
      byOwnerRole: {},
      byActionType: {},
    })
  })

  it("counts only non-resolved; sums missing; high priority; breakdowns", () => {
    const items = [
      base({
        id: "1",
        status: "open",
        priority: "high",
        missingAmount: 100,
        ownerRole: "billing",
        actionType: "prepare_invoice",
      }),
      base({
        id: "2",
        status: "in_progress",
        priority: "low",
        missingAmount: 50,
        ownerRole: "site_manager",
        actionType: "resolve_claim_issue",
      }),
      base({ id: "3", status: "resolved", missingAmount: 1000, ownerRole: "billing", actionType: "prepare_invoice" }),
    ]
    expect(recomputeActionCenterSummary(items)).toEqual({
      totalOpen: 2,
      totalHighPriority: 1,
      totalMissingAmount: 150,
      byOwnerRole: { billing: 1, site_manager: 1 },
      byActionType: { prepare_invoice: 1, resolve_claim_issue: 1 },
    })
  })

  it("blocked counts as open work", () => {
    const items = [base({ id: "b", status: "blocked", missingAmount: 5 })]
    const s = recomputeActionCenterSummary(items)
    expect(s.totalOpen).toBe(1)
    expect(s.totalMissingAmount).toBe(5)
  })

  it("deterministic for same input", () => {
    const items = [
      base({ id: "x", ownerRole: "finance", actionType: "manual_review" }),
      base({ id: "y", ownerRole: "billing", actionType: "prepare_invoice" }),
    ]
    expect(recomputeActionCenterSummary(items)).toEqual(recomputeActionCenterSummary(items))
  })
})
