import { describe, expect, it } from "vitest"

import { buildActionId, buildReviewActionsFromLeakageSignals } from "./build-review-actions-from-leakage-signals"
import type { LeakageSignal } from "./classify-match-results-into-leakage-signals"

function sig(overrides: Partial<LeakageSignal>): LeakageSignal {
  return {
    signalType: "missing_invoice",
    severity: "high",
    expectedIndex: null,
    invoiceIndex: null,
    matchKey: "k",
    reasons: [],
    sourceStatus: "unmatched_expected",
    ...overrides,
  }
}

describe("buildReviewActionsFromLeakageSignals", () => {
  it("missing_invoice -> priority 1 action", () => {
    const out = buildReviewActionsFromLeakageSignals({
      signals: [
        sig({
          signalType: "missing_invoice",
          severity: "high",
          expectedIndex: 0,
          matchKey: "a::b",
          reasons: ["No invoice match found"],
          sourceStatus: "unmatched_expected",
        }),
      ],
    })
    expect(out.actions[0]!.priority).toBe(1)
    expect(out.actions[0]!.actionType).toBe("review_missing_invoice")
    expect(out.actions[0]!.title).toBe("Missing invoice review")
  })

  it("unexpected_invoice -> priority 2 action", () => {
    const out = buildReviewActionsFromLeakageSignals({
      signals: [sig({ signalType: "unexpected_invoice", severity: "medium", invoiceIndex: 1, sourceStatus: "unmatched_invoice" })],
    })
    expect(out.actions[0]!.priority).toBe(2)
    expect(out.actions[0]!.actionType).toBe("review_unexpected_invoice")
  })

  it("quantity_mismatch -> priority 2 action", () => {
    const out = buildReviewActionsFromLeakageSignals({
      signals: [sig({ signalType: "quantity_mismatch", severity: "medium", sourceStatus: "partial_mismatch" })],
    })
    expect(out.actions[0]!.priority).toBe(2)
    expect(out.actions[0]!.actionType).toBe("review_quantity_mismatch")
  })

  it("unit_price_mismatch -> priority 1 action", () => {
    const out = buildReviewActionsFromLeakageSignals({
      signals: [sig({ signalType: "unit_price_mismatch", severity: "high", sourceStatus: "partial_mismatch" })],
    })
    expect(out.actions[0]!.priority).toBe(1)
    expect(out.actions[0]!.actionType).toBe("review_unit_price_mismatch")
  })

  it("total_price_mismatch -> priority 1 action", () => {
    const out = buildReviewActionsFromLeakageSignals({
      signals: [sig({ signalType: "total_price_mismatch", severity: "high", sourceStatus: "partial_mismatch" })],
    })
    expect(out.actions[0]!.priority).toBe(1)
    expect(out.actions[0]!.actionType).toBe("review_total_price_mismatch")
  })

  it("incomplete_comparison -> priority 3 action", () => {
    const out = buildReviewActionsFromLeakageSignals({
      signals: [sig({ signalType: "incomplete_comparison", severity: "low", sourceStatus: "partial_mismatch" })],
    })
    expect(out.actions[0]!.priority).toBe(3)
    expect(out.actions[0]!.actionType).toBe("review_incomplete_comparison")
  })

  it("deterministic actionId", () => {
    const matchKey = "day 1::physical exam"
    const expected = `review_missing_invoice::${encodeURIComponent(matchKey)}::0::x`
    expect(
      buildActionId("review_missing_invoice", matchKey, 0, null),
    ).toBe(expected)
    const out = buildReviewActionsFromLeakageSignals({
      signals: [
        sig({
          signalType: "missing_invoice",
          severity: "high",
          expectedIndex: 0,
          invoiceIndex: null,
          matchKey,
          reasons: ["No invoice match found"],
          sourceStatus: "unmatched_expected",
        }),
      ],
    })
    expect(out.actions[0]!.actionId).toBe(expected)
  })

  it("summary counts correct", () => {
    const out = buildReviewActionsFromLeakageSignals({
      signals: [
        sig({ signalType: "missing_invoice", severity: "high", sourceStatus: "unmatched_expected" }),
        sig({ signalType: "unexpected_invoice", severity: "medium", sourceStatus: "unmatched_invoice" }),
        sig({ signalType: "incomplete_comparison", severity: "low", sourceStatus: "partial_mismatch" }),
      ],
    })
    expect(out.summary.totalActions).toBe(3)
    expect(out.summary.byPriority).toEqual({ "1": 1, "2": 1, "3": 1 })
    expect(out.summary.highPriorityCount).toBe(1)
    expect(out.summary.mediumPriorityCount).toBe(1)
    expect(out.summary.lowPriorityCount).toBe(1)
    expect(out.summary.byActionType).toEqual({
      review_incomplete_comparison: 1,
      review_missing_invoice: 1,
      review_unexpected_invoice: 1,
    })
  })

  it("warnings propagate", () => {
    const out = buildReviewActionsFromLeakageSignals({
      signals: [sig({ signalType: "missing_invoice", severity: "high", sourceStatus: "unmatched_expected" })],
      warnings: ["Upstream."],
    })
    expect(out.warnings[0]).toBe("Upstream.")
    expect(out.warnings).not.toContain("No review actions generated.")
  })

  it("empty signals -> no actions + warning", () => {
    const out = buildReviewActionsFromLeakageSignals({ signals: [] })
    expect(out.actions).toEqual([])
    expect(out.warnings).toEqual(["No review actions generated."])
    expect(out.summary.totalActions).toBe(0)
    expect(out.summary.byPriority).toEqual({ "1": 0, "2": 0, "3": 0 })
  })
})
