import { describe, expect, it } from "vitest"

import type { EventStoreWriteInputRow } from "./to-event-store-write-input"
import { toEventStoreBoundaryInput } from "./to-event-store-boundary-input"
import { toEventStoreHandoffPayload } from "./to-event-store-handoff-payload"
import {
  boundaryRowClientRef,
  runEventStoreDryWrite,
} from "./run-event-store-dry-write"

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
    sourceDocumentId: "doc",
    sourceActionId: "act",
    sourceDraftEventId: "draft",
    sourceSignalType: "missing_invoice",
    sourceActionType: "review_missing_invoice",
    matchKey: "v::l",
    expectedIndex: null,
    invoiceIndex: null,
    reasons: ["r"],
    metadata: { category: "revenue_protection", candidateType: "review_action" },
    ...overrides,
  }
}

async function oneValidBoundaryRow(): Promise<Record<string, unknown>> {
  const handoff = toEventStoreHandoffPayload({
    documentId: "d",
    rows: [writeRow({ clientEventId: "write-input::dry-1" })],
  })
  const { rows } = toEventStoreBoundaryInput({ payload: handoff })
  return structuredClone(rows[0]!) as Record<string, unknown>
}

describe("boundaryRowClientRef", () => {
  it("prefers clientEventId from metadata.documentEngine", () => {
    const ref = boundaryRowClientRef({
      id: "id-other",
      metadata: { documentEngine: { clientEventId: "ce-pref" } },
    })
    expect(ref).toBe("ce-pref")
  })

  it("uses top-level eventId when clientEventId absent", () => {
    const ref = boundaryRowClientRef({
      id: "id-only",
      eventId: "evt-x",
      metadata: { documentEngine: { sourceActionId: "sa-fallback" } },
    })
    expect(ref).toBe("evt-x")
  })

  it("uses sourceActionId when clientEventId and eventId absent", () => {
    const ref = boundaryRowClientRef({
      id: "rid",
      metadata: { documentEngine: { sourceActionId: "sa-only" } },
    })
    expect(ref).toBe("sa-only")
  })
})

describe("runEventStoreDryWrite", () => {
  it("accepts all valid boundary rows", async () => {
    const a = await oneValidBoundaryRow()
    const b = await oneValidBoundaryRow()
    ;(b as { id: string }).id = "write-input::dry-2"
    const out = await runEventStoreDryWrite({ rows: [a, b] })
    expect(out.summary.totalRows).toBe(2)
    expect(out.summary.acceptedCount).toBe(2)
    expect(out.summary.rejectedCount).toBe(0)
    expect(out.rejected).toEqual([])
    expect(out.accepted.every((x) => x.status === "accepted")).toBe(true)
  })

  it("rejects invalid row (missing title)", async () => {
    const row = await oneValidBoundaryRow()
    delete row.title
    const out = await runEventStoreDryWrite({ rows: [row] })
    expect(out.summary.acceptedCount).toBe(0)
    expect(out.summary.rejectedCount).toBe(1)
    expect(out.rejected[0]!.reasons.length).toBeGreaterThan(0)
  })

  it("mixed valid and invalid", async () => {
    const good = await oneValidBoundaryRow()
    const bad = structuredClone(good)
    delete bad.description
    const out = await runEventStoreDryWrite({ rows: [good, bad] })
    expect(out.summary.acceptedCount).toBe(1)
    expect(out.summary.rejectedCount).toBe(1)
    expect(out.accepted[0]!.index).toBe(0)
    expect(out.rejected[0]!.index).toBe(1)
  })

  it("clientRef on accepted rows matches boundaryRowClientRef", async () => {
    const row = await oneValidBoundaryRow()
    const out = await runEventStoreDryWrite({ rows: [row] })
    expect(out.accepted[0]!.clientRef).toBe(boundaryRowClientRef(row))
  })

  it("warns on empty input", async () => {
    const out = await runEventStoreDryWrite({ rows: [] })
    expect(out.warnings[0]).toBe("No boundary rows provided for dry write.")
    expect(out.summary.totalRows).toBe(0)
    expect(out.warnings.some((w) => w.includes("rejected"))).toBe(false)
  })

  it("warns when any row rejected", async () => {
    const row = await oneValidBoundaryRow()
    delete row.title
    const out = await runEventStoreDryWrite({ rows: [row] })
    expect(out.warnings.some((w) => w.includes("Some boundary rows were rejected"))).toBe(true)
  })
})
