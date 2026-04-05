import { describe, expect, it } from "vitest"

import type { EventStoreWriteInputRow } from "./to-event-store-write-input"
import { toEventStoreHandoffPayload } from "./to-event-store-handoff-payload"

function row(overrides: Partial<EventStoreWriteInputRow> & Pick<EventStoreWriteInputRow, "clientEventId">): EventStoreWriteInputRow {
  return {
    eventType: "revenue_review_action",
    eventStatus: "open",
    title: "T",
    description: "D",
    priority: 1,
    severity: "high",
    sourceDocumentId: "doc",
    sourceActionId: "a",
    sourceDraftEventId: "d",
    sourceSignalType: "missing_invoice",
    sourceActionType: "review_missing_invoice",
    matchKey: "k",
    expectedIndex: null,
    invoiceIndex: null,
    reasons: ["r"],
    metadata: { category: "revenue_protection", candidateType: "review_action" },
    ...overrides,
  }
}

describe("toEventStoreHandoffPayload", () => {
  it("packages handoff with documentId, events, eventCount, summary", () => {
    const rows = [row({ clientEventId: "w1" })]
    const res = toEventStoreHandoffPayload({ documentId: "handoff-doc", rows })

    expect(res.documentId).toBe("handoff-doc")
    expect(res.events).toBe(rows)
    expect(res.eventCount).toBe(1)
    expect(res.summary.totalRows).toBe(1)
    expect(res.warnings).toEqual([])
  })

  it("eventCount matches rows length", () => {
    const rows = [row({ clientEventId: "a" }), row({ clientEventId: "b" })]
    const res = toEventStoreHandoffPayload({ documentId: null, rows })
    expect(res.eventCount).toBe(2)
    expect(res.summary.totalRows).toBe(2)
  })

  it("summary priority and severity counts are correct for mixed rows", () => {
    const rows: EventStoreWriteInputRow[] = [
      row({ clientEventId: "1", priority: 1, severity: "high" }),
      row({
        clientEventId: "2",
        priority: 2,
        severity: "medium",
        sourceSignalType: "unexpected_invoice",
        sourceActionType: "review_unexpected_invoice",
      }),
      row({
        clientEventId: "3",
        priority: 3,
        severity: "low",
        sourceSignalType: "quantity_mismatch",
        sourceActionType: "review_quantity_mismatch",
      }),
    ]
    const s = toEventStoreHandoffPayload({ documentId: "d", rows }).summary
    expect(s.priority1Count).toBe(1)
    expect(s.priority2Count).toBe(1)
    expect(s.priority3Count).toBe(1)
    expect(s.highSeverityCount).toBe(1)
    expect(s.mediumSeverityCount).toBe(1)
    expect(s.lowSeverityCount).toBe(1)
  })

  it("adds warning when rows empty", () => {
    const res = toEventStoreHandoffPayload({ documentId: "x", rows: [] })
    expect(res.events).toEqual([])
    expect(res.eventCount).toBe(0)
    expect(res.summary.totalRows).toBe(0)
    expect(res.warnings).toEqual(["No event-store write-input rows provided for handoff."])
  })

  it("passes through documentId including null", () => {
    expect(toEventStoreHandoffPayload({ documentId: null, rows: [] }).documentId).toBeNull()
    expect(toEventStoreHandoffPayload({ documentId: "id-1", rows: [] }).documentId).toBe("id-1")
  })
})
