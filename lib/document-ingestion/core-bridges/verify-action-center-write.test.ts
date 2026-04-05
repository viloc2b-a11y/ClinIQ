import { describe, expect, it, beforeEach, afterEach } from "vitest"

import type { EventStoreWriteInputRow } from "./to-event-store-write-input"
import { toEventStoreBoundaryInput } from "./to-event-store-boundary-input"
import { toEventStoreHandoffPayload } from "./to-event-store-handoff-payload"
import { boundaryRowClientRef } from "./run-event-store-dry-write"
import { runEventStoreControlledWrite } from "./run-event-store-controlled-write"
import { verifyActionCenterWrite } from "./verify-action-center-write"
import {
  MemoryPersistenceAdapter,
  resetMemoryPersistenceAdapterState,
} from "../../cliniq-core/action-center/memory-persistence-adapter"

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

async function boundaryRowsFromClientIds(ids: string[]): Promise<Record<string, unknown>[]> {
  const handoff = toEventStoreHandoffPayload({
    documentId: "verify-doc",
    rows: ids.map((clientEventId) => writeRow({ clientEventId })),
  })
  const { rows } = toEventStoreBoundaryInput({ payload: handoff })
  return rows.map((r) => structuredClone(r) as Record<string, unknown>)
}

describe("verifyActionCenterWrite", () => {
  beforeEach(() => {
    resetMemoryPersistenceAdapterState()
  })

  afterEach(() => {
    resetMemoryPersistenceAdapterState()
  })

  it("all items found after MemoryPersistenceAdapter write", async () => {
    const rows = await boundaryRowsFromClientIds(["write-input::vf-1", "write-input::vf-2"])
    const adapter = new MemoryPersistenceAdapter()
    const write = await runEventStoreControlledWrite({
      rows,
      allowWrite: true,
      persistenceAdapter: adapter,
    })
    expect(write.writeResult.succeeded).toBe(2)

    const expectedClientRefs = rows.map((r) => boundaryRowClientRef(r)).filter((x): x is string => x != null)
    const verify = await verifyActionCenterWrite({ adapter, expectedClientRefs })

    expect(verify.totalExpected).toBe(2)
    expect(verify.found).toBe(2)
    expect(verify.missing).toEqual([])
    expect(verify.matched).toHaveLength(2)
    expect(verify.warnings).toEqual([])
  })

  it("partial missing when an expected ref was never written", async () => {
    const rows = await boundaryRowsFromClientIds(["write-input::vf-a", "write-input::vf-b"])
    const adapter = new MemoryPersistenceAdapter()
    await runEventStoreControlledWrite({
      rows,
      allowWrite: true,
      persistenceAdapter: adapter,
    })

    const refs = rows.map((r) => boundaryRowClientRef(r)).filter((x): x is string => x != null)
    const expectedClientRefs = [...refs, "write-input::never-upserted"]

    const verify = await verifyActionCenterWrite({ adapter, expectedClientRefs })
    expect(verify.totalExpected).toBe(3)
    expect(verify.found).toBe(2)
    expect(verify.missing).toEqual(["write-input::never-upserted"])
    expect(verify.warnings).toContain("Some expected action items were not found in Action Center.")
  })

  it("empty adapter yields all missing for non-empty expectations", async () => {
    resetMemoryPersistenceAdapterState()
    const adapter = new MemoryPersistenceAdapter()
    const expectedClientRefs = ["write-input::ghost-1", "write-input::ghost-2"]
    const verify = await verifyActionCenterWrite({ adapter, expectedClientRefs })
    expect(verify.found).toBe(0)
    expect(verify.missing).toEqual(expectedClientRefs)
    expect(verify.warnings.length).toBe(1)
  })
})
