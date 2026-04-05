import { describe, expect, it } from "vitest"

import type { ReviewAction } from "../matching/build-review-actions-from-leakage-signals"
import { toDraftEventLogRows } from "./to-draft-event-log-rows"

function action(partial: Partial<ReviewAction> & Pick<ReviewAction, "actionId">): ReviewAction {
  return {
    priority: 1,
    actionType: "review_missing_invoice",
    title: "Missing invoice review",
    description: "Missing invoice review for match key: k",
    expectedIndex: 0,
    invoiceIndex: null,
    matchKey: "k",
    sourceSignalType: "missing_invoice",
    severity: "high",
    reasons: ["No invoice match found"],
    status: "open",
    ...partial,
  }
}

describe("toDraftEventLogRows", () => {
  it("maps one action to one draft row with fixed event type and status", () => {
    const a = action({ actionId: "act-1" })
    const res = toDraftEventLogRows({ documentId: "d1", actions: [a] })
    expect(res.rows).toHaveLength(1)
    expect(res.rows[0].draftEventId).toBe("draft-event::act-1")
    expect(res.rows[0].eventType).toBe("revenue_review_action")
    expect(res.rows[0].eventStatus).toBe("open")
    expect(res.rows[0].actionId).toBe("act-1")
    expect(res.rows[0].actionType).toBe("review_missing_invoice")
    expect(res.rows[0].priority).toBe(1)
    expect(res.rows[0].severity).toBe("high")
    expect(res.rows[0].title).toBe(a.title)
    expect(res.rows[0].description).toBe(a.description)
    expect(res.rows[0].matchKey).toBe("k")
    expect(res.rows[0].expectedIndex).toBe(0)
    expect(res.rows[0].invoiceIndex).toBeNull()
    expect(res.rows[0].sourceSignalType).toBe("missing_invoice")
    expect(res.warnings).toEqual([])
  })

  it("draftEventId is draft-event:: prefixed actionId", () => {
    const res = toDraftEventLogRows({
      documentId: null,
      actions: [action({ actionId: "review_unit_price_mismatch::x::1::1" })],
    })
    expect(res.rows[0].draftEventId).toBe("draft-event::review_unit_price_mismatch::x::1::1")
  })

  it("priority counts correct", () => {
    const res = toDraftEventLogRows({
      documentId: null,
      actions: [
        action({ actionId: "p1", priority: 1 }),
        action({ actionId: "p2", priority: 2 }),
        action({ actionId: "p2b", priority: 2 }),
        action({ actionId: "p3", priority: 3 }),
      ],
    })
    expect(res.summary.priority1Count).toBe(1)
    expect(res.summary.priority2Count).toBe(2)
    expect(res.summary.priority3Count).toBe(1)
  })

  it("severity counts correct", () => {
    const res = toDraftEventLogRows({
      documentId: null,
      actions: [
        action({ actionId: "h", severity: "high" }),
        action({ actionId: "m", severity: "medium", priority: 2 }),
        action({ actionId: "l", severity: "low", priority: 3 }),
      ],
    })
    expect(res.summary.highSeverityCount).toBe(1)
    expect(res.summary.mediumSeverityCount).toBe(1)
    expect(res.summary.lowSeverityCount).toBe(1)
  })

  it("reasons propagate as a copy", () => {
    const reasons = ["a", "b"]
    const res = toDraftEventLogRows({
      documentId: null,
      actions: [action({ actionId: "r", reasons })],
    })
    expect(res.rows[0].reasons).toEqual(reasons)
    expect(res.rows[0].reasons).not.toBe(reasons)
    reasons.push("c")
    expect(res.rows[0].reasons).toEqual(["a", "b"])
  })

  it("empty actions emits warning", () => {
    const res = toDraftEventLogRows({ documentId: null, actions: [] })
    expect(res.rows).toEqual([])
    expect(res.summary.totalActions).toBe(0)
    expect(res.warnings).toEqual(["No review actions provided for draft event log rows."])
  })
})
