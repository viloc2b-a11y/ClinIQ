import { describe, expect, it } from "vitest"

import type { DraftRevenueReviewEventRow } from "./to-draft-event-log-rows"
import { toEventLogSchemaCandidate } from "./to-event-log-schema-candidate"

function draft(
  partial: Partial<DraftRevenueReviewEventRow> & Pick<DraftRevenueReviewEventRow, "draftEventId" | "actionId">,
): DraftRevenueReviewEventRow {
  return {
    eventType: "revenue_review_action",
    eventStatus: "open",
    actionType: "review_missing_invoice",
    priority: 1,
    severity: "high",
    title: "Missing invoice review",
    description: "Missing invoice review for match key: k",
    matchKey: "k",
    expectedIndex: 0,
    invoiceIndex: null,
    sourceSignalType: "missing_invoice",
    reasons: ["No invoice match found"],
    ...partial,
  }
}

describe("toEventLogSchemaCandidate", () => {
  it("maps one draft row to one candidate with fixed category, type, status", () => {
    const d = draft({ draftEventId: "draft-event::a1", actionId: "a1" })
    const res = toEventLogSchemaCandidate({ documentId: "doc-1", rows: [d] })
    expect(res.rows).toHaveLength(1)
    expect(res.rows[0].eventId).toBe("event-candidate::draft-event::a1")
    expect(res.rows[0].category).toBe("revenue_protection")
    expect(res.rows[0].type).toBe("review_action")
    expect(res.rows[0].status).toBe("open")
    expect(res.rows[0].title).toBe(d.title)
    expect(res.rows[0].description).toBe(d.description)
    expect(res.rows[0].priority).toBe(1)
    expect(res.rows[0].severity).toBe("high")
    expect(res.warnings).toEqual([])
  })

  it("eventId is event-candidate:: prefixed draftEventId", () => {
    const res = toEventLogSchemaCandidate({
      documentId: null,
      rows: [draft({ draftEventId: "draft-event::x::1::1", actionId: "x" })],
    })
    expect(res.rows[0].eventId).toBe("event-candidate::draft-event::x::1::1")
  })

  it("sourceRef maps documentId, actionId, draftEventId, signal and action types", () => {
    const d = draft({
      draftEventId: "d1",
      actionId: "act-9",
      sourceSignalType: "unit_price_mismatch",
      actionType: "review_unit_price_mismatch",
    })
    const res = toEventLogSchemaCandidate({ documentId: "D", rows: [d] })
    expect(res.rows[0].sourceRef).toEqual({
      documentId: "D",
      actionId: "act-9",
      draftEventId: "d1",
      sourceSignalType: "unit_price_mismatch",
      actionType: "review_unit_price_mismatch",
    })
  })

  it("payload maps matchKey, indices, and reasons copy", () => {
    const reasons = ["r1"]
    const d = draft({
      draftEventId: "d",
      actionId: "a",
      matchKey: "mk",
      expectedIndex: 2,
      invoiceIndex: 3,
      reasons,
    })
    const res = toEventLogSchemaCandidate({ documentId: null, rows: [d] })
    expect(res.rows[0].payload).toEqual({
      matchKey: "mk",
      expectedIndex: 2,
      invoiceIndex: 3,
      reasons: ["r1"],
    })
    expect(res.rows[0].payload.reasons).not.toBe(reasons)
  })

  it("priority counts correct", () => {
    const res = toEventLogSchemaCandidate({
      documentId: null,
      rows: [
        draft({ draftEventId: "1", actionId: "a1", priority: 1 }),
        draft({ draftEventId: "2", actionId: "a2", priority: 2 }),
        draft({ draftEventId: "3", actionId: "a3", priority: 2 }),
        draft({ draftEventId: "4", actionId: "a4", priority: 3 }),
      ],
    })
    expect(res.summary.priority1Count).toBe(1)
    expect(res.summary.priority2Count).toBe(2)
    expect(res.summary.priority3Count).toBe(1)
  })

  it("severity counts correct", () => {
    const res = toEventLogSchemaCandidate({
      documentId: null,
      rows: [
        draft({ draftEventId: "h", actionId: "h", severity: "high" }),
        draft({ draftEventId: "m", actionId: "m", severity: "medium", priority: 2 }),
        draft({ draftEventId: "l", actionId: "l", severity: "low", priority: 3 }),
      ],
    })
    expect(res.summary.highSeverityCount).toBe(1)
    expect(res.summary.mediumSeverityCount).toBe(1)
    expect(res.summary.lowSeverityCount).toBe(1)
  })

  it("empty rows emits warning and zero summary counts", () => {
    const res = toEventLogSchemaCandidate({ documentId: null, rows: [] })
    expect(res.rows).toEqual([])
    expect(res.summary.totalDraftRows).toBe(0)
    expect(res.summary.totalCandidateRows).toBe(0)
    expect(res.summary.openCount).toBe(0)
    expect(res.warnings).toEqual(["No draft event rows provided for event-log schema candidate."])
  })
})
