import { describe, expect, it } from "vitest"

import { dbRowToActionItemRow } from "../../cliniq-core/action-center/supabase-persistence-adapter"
import type { EventStoreHandoffPayload } from "./to-event-store-handoff-payload"
import type { EventStoreWriteInputRow } from "./to-event-store-write-input"
import { toEventStoreBoundaryInput } from "./to-event-store-boundary-input"

function writeRow(
  overrides: Partial<EventStoreWriteInputRow> & Pick<EventStoreWriteInputRow, "clientEventId">,
): EventStoreWriteInputRow {
  return {
    eventType: "revenue_review_action",
    eventStatus: "open",
    title: "T",
    description: "D",
    priority: 1,
    severity: "high",
    sourceDocumentId: "doc-a",
    sourceActionId: "act-a",
    sourceDraftEventId: "draft-a",
    sourceSignalType: "missing_invoice",
    sourceActionType: "review_missing_invoice",
    matchKey: "visit one::line a",
    expectedIndex: 0,
    invoiceIndex: null,
    reasons: ["r1"],
    metadata: { category: "revenue_protection", candidateType: "review_action" },
    ...overrides,
  }
}

function payloadFromEvents(
  events: EventStoreWriteInputRow[],
  documentId: string | null = "p-doc",
): EventStoreHandoffPayload {
  return {
    documentId,
    eventCount: events.length,
    events,
    summary: {
      totalRows: events.length,
      priority1Count: 0,
      priority2Count: 0,
      priority3Count: 0,
      highSeverityCount: 0,
      mediumSeverityCount: 0,
      lowSeverityCount: 0,
    },
    warnings: [],
  }
}

describe("toEventStoreBoundaryInput", () => {
  it("maps one handoff event to one boundary row", () => {
    const e = writeRow({ clientEventId: "write-input::evt-1" })
    const res = toEventStoreBoundaryInput({ payload: payloadFromEvents([e]) })
    expect(res.rows).toHaveLength(1)
    expect(res.summary.totalBoundaryRows).toBe(1)
    expect(res.summary.totalInputEvents).toBe(1)
  })

  it("preserves deterministic client-side id as ActionItemRow.id", () => {
    const id = "write-input::stable-id"
    const res = toEventStoreBoundaryInput({
      payload: payloadFromEvents([writeRow({ clientEventId: id })]),
    })
    expect(res.rows[0]!.id).toBe(id)
  })

  it("retains traceability fields under metadata.documentEngine", () => {
    const e = writeRow({
      clientEventId: "cid",
      sourceDocumentId: "sd",
      sourceActionId: "sa",
      sourceDraftEventId: "sdraft",
      sourceSignalType: "unit_price_mismatch",
      sourceActionType: "review_unit_price_mismatch",
      matchKey: "v::l",
      expectedIndex: 2,
      invoiceIndex: 3,
      reasons: ["a", "b"],
    })
    const m = toEventStoreBoundaryInput({ payload: payloadFromEvents([e]) }).rows[0]!.metadata
      .documentEngine as Record<string, unknown>
    expect(m.sourceDocumentId).toBe("sd")
    expect(m.sourceActionId).toBe("sa")
    expect(m.sourceDraftEventId).toBe("sdraft")
    expect(m.sourceSignalType).toBe("unit_price_mismatch")
    expect(m.sourceActionType).toBe("review_unit_price_mismatch")
    expect(m.matchKey).toBe("v::l")
    expect(m.expectedIndex).toBe(2)
    expect(m.invoiceIndex).toBe(3)
    expect(m.reasons).toEqual(["a", "b"])
    expect(m.handoffDocumentId).toBe("p-doc")
  })

  it("sets deterministic placeholders for unresolved study context, amounts, and timestamps", () => {
    const res = toEventStoreBoundaryInput({
      payload: payloadFromEvents([writeRow({ clientEventId: "x" })]),
    })
    const r = res.rows[0]!
    expect(r.study_id).toBe("document-engine:pending-study")
    expect(r.subject_id).toBe("document-engine:pending-subject")
    expect(r.expected_amount).toBe(0)
    expect(r.invoiced_amount).toBe(0)
    expect(r.missing_amount).toBe(0)
    expect(r.created_at).toBe("1970-01-01T00:00:00.000Z")
    expect(r.updated_at).toBe("1970-01-01T00:00:00.000Z")
    expect(r.sponsor_id).toBeNull()
  })

  it("summary counts match source events", () => {
    const events = [
      writeRow({ clientEventId: "1", priority: 1, severity: "high" }),
      writeRow({
        clientEventId: "2",
        priority: 2,
        severity: "medium",
        sourceSignalType: "unexpected_invoice",
        sourceActionType: "review_unexpected_invoice",
      }),
      writeRow({
        clientEventId: "3",
        priority: 3,
        severity: "low",
        sourceSignalType: "quantity_mismatch",
        sourceActionType: "review_quantity_mismatch",
      }),
    ]
    const s = toEventStoreBoundaryInput({ payload: payloadFromEvents(events) }).summary
    expect(s.priority1Count).toBe(1)
    expect(s.priority2Count).toBe(1)
    expect(s.priority3Count).toBe(1)
    expect(s.highSeverityCount).toBe(1)
    expect(s.mediumSeverityCount).toBe(1)
    expect(s.lowSeverityCount).toBe(1)
  })

  it("warns on empty events", () => {
    const res = toEventStoreBoundaryInput({
      payload: payloadFromEvents([], "doc"),
    })
    expect(res.rows).toEqual([])
    expect(res.warnings[0]).toBe("No handoff events provided for event-store boundary input.")
    expect(res.warnings.some((w) => w.includes("placeholder"))).toBe(false)
  })

  it("boundary rows round-trip through dbRowToActionItemRow without persistence", () => {
    const e = writeRow({ clientEventId: "write-input::rt-1", matchKey: "alpha::beta" })
    const row = toEventStoreBoundaryInput({ payload: payloadFromEvents([e]) }).rows[0]!
    const rt = dbRowToActionItemRow(row as unknown as Record<string, unknown>)
    expect(rt.id).toBe(e.clientEventId)
    expect(rt.visit_name).toBe("alpha")
    expect(rt.line_code).toBe("beta")
    expect(rt.action_type).toBe("revenue_review_action")
    expect((rt.metadata.documentEngine as { sourceActionId: string }).sourceActionId).toBe("act-a")
  })
})
