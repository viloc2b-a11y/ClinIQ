import { describe, expect, it } from "vitest"

import type { EventLogSchemaCandidateRow } from "./to-event-log-schema-candidate"
import { toEventStoreWriteInput } from "./to-event-store-write-input"

function candidate(overrides: Partial<EventLogSchemaCandidateRow> = {}): EventLogSchemaCandidateRow {
  return {
    eventId: "event-candidate::draft-event::a::1",
    category: "revenue_protection",
    type: "review_action",
    status: "open",
    title: "T",
    description: "D",
    priority: 1,
    severity: "high",
    sourceRef: {
      documentId: "doc-1",
      actionId: "act-1",
      draftEventId: "draft-1",
      sourceSignalType: "missing_invoice",
      actionType: "review_missing_invoice",
    },
    payload: {
      matchKey: "k::v",
      expectedIndex: 0,
      invoiceIndex: null,
      reasons: ["r1"],
    },
    ...overrides,
  }
}

describe("toEventStoreWriteInput", () => {
  it("maps one candidate row cleanly", () => {
    const row = candidate()
    const res = toEventStoreWriteInput({ documentId: "top-doc", rows: [row] })

    expect(res.rows).toHaveLength(1)
    const w = res.rows[0]
    expect(w.eventType).toBe("revenue_review_action")
    expect(w.eventStatus).toBe("open")
    expect(w.title).toBe("T")
    expect(w.description).toBe("D")
    expect(w.priority).toBe(1)
    expect(w.severity).toBe("high")
    expect(res.documentId).toBe("top-doc")
  })

  it("uses deterministic clientEventId", () => {
    const row = candidate({ eventId: "evt-xyz" })
    const res = toEventStoreWriteInput({ documentId: null, rows: [row] })
    expect(res.rows[0].clientEventId).toBe("write-input::evt-xyz")
  })

  it("maps source fields from sourceRef", () => {
    const row = candidate({
      sourceRef: {
        documentId: "sd",
        actionId: "sa",
        draftEventId: "sdraft",
        sourceSignalType: "unit_price_mismatch",
        actionType: "review_unit_price_mismatch",
      },
    })
    const w = toEventStoreWriteInput({ documentId: null, rows: [row] }).rows[0]
    expect(w.sourceDocumentId).toBe("sd")
    expect(w.sourceActionId).toBe("sa")
    expect(w.sourceDraftEventId).toBe("sdraft")
    expect(w.sourceSignalType).toBe("unit_price_mismatch")
    expect(w.sourceActionType).toBe("review_unit_price_mismatch")
  })

  it("maps payload fields to top-level write fields", () => {
    const row = candidate({
      payload: {
        matchKey: "m",
        expectedIndex: 2,
        invoiceIndex: 3,
        reasons: ["a", "b"],
      },
    })
    const w = toEventStoreWriteInput({ documentId: null, rows: [row] }).rows[0]
    expect(w.matchKey).toBe("m")
    expect(w.expectedIndex).toBe(2)
    expect(w.invoiceIndex).toBe(3)
    expect(w.reasons).toEqual(["a", "b"])
  })

  it("copies reasons without aliasing mutable array", () => {
    const reasons = ["x"]
    const row = candidate({ payload: { matchKey: "k", expectedIndex: null, invoiceIndex: null, reasons } })
    const w = toEventStoreWriteInput({ documentId: null, rows: [row] }).rows[0]
    reasons.push("y")
    expect(w.reasons).toEqual(["x"])
  })

  it("sets fixed metadata", () => {
    const w = toEventStoreWriteInput({ documentId: null, rows: [candidate()] }).rows[0]
    expect(w.metadata).toEqual({
      category: "revenue_protection",
      candidateType: "review_action",
    })
  })

  it("counts priorities across four mixed rows", () => {
    const rows: EventLogSchemaCandidateRow[] = [
      candidate({ eventId: "e1", priority: 1 }),
      candidate({ eventId: "e2", priority: 2 }),
      candidate({ eventId: "e3", priority: 3 }),
      candidate({ eventId: "e4", priority: 1 }),
    ]
    const s = toEventStoreWriteInput({ documentId: null, rows }).summary
    expect(s.priority1Count).toBe(2)
    expect(s.priority2Count).toBe(1)
    expect(s.priority3Count).toBe(1)
    expect(s.totalCandidateRows).toBe(4)
    expect(s.totalWriteRows).toBe(4)
    expect(s.openCount).toBe(4)
  })

  it("counts severities across four mixed rows", () => {
    const rows: EventLogSchemaCandidateRow[] = [
      candidate({ eventId: "e1", severity: "high" }),
      candidate({ eventId: "e2", severity: "medium" }),
      candidate({ eventId: "e3", severity: "low" }),
      candidate({ eventId: "e4", severity: "high" }),
    ]
    const s = toEventStoreWriteInput({ documentId: null, rows }).summary
    expect(s.highSeverityCount).toBe(2)
    expect(s.mediumSeverityCount).toBe(1)
    expect(s.lowSeverityCount).toBe(1)
  })

  it("adds warning when rows empty", () => {
    const res = toEventStoreWriteInput({ documentId: "d", rows: [] })
    expect(res.rows).toEqual([])
    expect(res.warnings).toEqual([
      "No event-log candidate rows provided for event-store write input.",
    ])
    expect(res.summary.totalCandidateRows).toBe(0)
    expect(res.summary.totalWriteRows).toBe(0)
    expect(res.summary.openCount).toBe(0)
    expect(res.summary.priority1Count).toBe(0)
    expect(res.summary.priority3Count).toBe(0)
  })

  it("has no warnings when rows non-empty", () => {
    const res = toEventStoreWriteInput({ documentId: null, rows: [candidate()] })
    expect(res.warnings).toEqual([])
  })
})
