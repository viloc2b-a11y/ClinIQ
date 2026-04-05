import { describe, expect, it, beforeEach, afterEach } from "vitest"

import type { EventStoreWriteInputRow } from "./to-event-store-write-input"
import { toEventStoreBoundaryInput } from "./to-event-store-boundary-input"
import { toEventStoreHandoffPayload } from "./to-event-store-handoff-payload"
import { boundaryRowClientRef, runEventStoreDryWrite } from "./run-event-store-dry-write"
import {
  mapWriterResult,
  runEventStoreControlledWrite,
  type ControlledWriter,
} from "./run-event-store-controlled-write"
import type { ActionCenterPersistenceAdapter } from "../../cliniq-core/action-center/persistence-adapter"
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

async function oneValidBoundaryRow(clientEventId = "write-input::ctrl-1"): Promise<Record<string, unknown>> {
  const handoff = toEventStoreHandoffPayload({
    documentId: "d",
    rows: [writeRow({ clientEventId })],
  })
  const { rows } = toEventStoreBoundaryInput({ payload: handoff })
  return structuredClone(rows[0]!) as Record<string, unknown>
}

describe("mapWriterResult", () => {
  it("aggregates counts and copies notes", () => {
    const m = mapWriterResult({
      succeeded: [{ index: 0, clientRef: "a" }],
      failed: [{ index: 1, clientRef: "b", reasons: ["x"] }],
      notes: ["from writer"],
    })
    expect(m.succeeded).toBe(1)
    expect(m.failed).toBe(1)
    expect(m.notes).toEqual(["from writer"])
  })
})

describe("runEventStoreControlledWrite", () => {
  it("allowWrite false stays dry_run with valid rows", async () => {
    const row = await oneValidBoundaryRow()
    const out = await runEventStoreControlledWrite({ rows: [row], allowWrite: false })
    expect(out.mode).toBe("dry_run")
    expect(out.writeResult.attempted).toBe(false)
    expect(out.writeResult.notes).toContain(
      "Write disabled. Returning dry-run style result only.",
    )
  })

  it("allowWrite omitted defaults to dry_run", async () => {
    const row = await oneValidBoundaryRow()
    const out = await runEventStoreControlledWrite({ rows: [row] })
    expect(out.mode).toBe("dry_run")
    expect(out.writeResult.attempted).toBe(false)
  })

  it("allowWrite true + injected writer succeeds for all accepted rows", async () => {
    const a = await oneValidBoundaryRow("write-input::w1")
    const b = await oneValidBoundaryRow("write-input::w2")
    const writer: ControlledWriter = async ({ rows }) => ({
      succeeded: rows.map((row, index) => ({
        index,
        clientRef: boundaryRowClientRef(row),
      })),
      failed: [],
      notes: ["ok"],
    })
    const out = await runEventStoreControlledWrite({
      rows: [a, b],
      allowWrite: true,
      writer,
    })
    expect(out.mode).toBe("write_attempt")
    expect(out.writeResult.attempted).toBe(true)
    expect(out.writeResult.succeeded).toBe(2)
    expect(out.writeResult.failed).toBe(0)
    expect(out.writeResult.notes).toContain("ok")
    expect(out.summary.succeededWriteCount).toBe(2)
    expect(out.warnings.some((w) => w.includes("Boundary write attempt reported failures"))).toBe(false)
  })

  it("allowWrite true + injected writer partial failure preserves notes and counts", async () => {
    const a = await oneValidBoundaryRow("write-input::p1")
    const b = await oneValidBoundaryRow("write-input::p2")
    const writer: ControlledWriter = async () => ({
      succeeded: [{ index: 0, clientRef: boundaryRowClientRef(a) }],
      failed: [
        {
          index: 1,
          clientRef: boundaryRowClientRef(b),
          reasons: ["simulated reject"],
        },
      ],
      notes: ["partial note"],
    })
    const out = await runEventStoreControlledWrite({
      rows: [a, b],
      allowWrite: true,
      writer,
    })
    expect(out.writeResult.attempted).toBe(true)
    expect(out.writeResult.succeeded).toBe(1)
    expect(out.writeResult.failed).toBe(1)
    expect(out.writeResult.notes).toContain("partial note")
    expect(out.warnings.some((w) => w === "Boundary write attempt reported failures.")).toBe(true)
  })

  it("allowWrite true + injected writer throws: attempted, all failed, prefix note and warning", async () => {
    const row = await oneValidBoundaryRow()
    const writer: ControlledWriter = async () => {
      throw new Error("boom")
    }
    const out = await runEventStoreControlledWrite({
      rows: [row],
      allowWrite: true,
      writer,
    })
    expect(out.writeResult.attempted).toBe(true)
    expect(out.writeResult.succeeded).toBe(0)
    expect(out.writeResult.failed).toBe(1)
    expect(out.writeResult.notes.some((n) => n.startsWith("Boundary writer threw error: boom"))).toBe(true)
    expect(out.warnings.some((w) => w === "Boundary write attempt reported failures.")).toBe(true)
  })

  it("invalid rows are never sent to writer", async () => {
    const good = await oneValidBoundaryRow()
    const bad = structuredClone(good)
    delete bad.description
    let received: unknown[] | null = null
    const writer: ControlledWriter = async ({ rows }) => {
      received = rows
      return {
        succeeded: rows.map((row, index) => ({ index, clientRef: boundaryRowClientRef(row) })),
        failed: [],
      }
    }
    const out = await runEventStoreControlledWrite({
      rows: [good, bad],
      allowWrite: true,
      writer,
    })
    expect(received).toHaveLength(1)
    expect((received as Record<string, unknown>[])[0]).toEqual(good)
    expect(out.summary.rejectedCount).toBe(1)
  })

  it("allowWrite true with no writer and no persistenceAdapter", async () => {
    const row = await oneValidBoundaryRow()
    const out = await runEventStoreControlledWrite({
      rows: [row],
      allowWrite: true,
    })
    expect(out.mode).toBe("write_attempt")
    expect(out.writeResult.attempted).toBe(false)
    expect(out.writeResult.notes).toContain(
      "No safe boundary write function is currently available.",
    )
    expect(out.warnings.some((w) => w.includes("no safe boundary writer is available"))).toBe(true)
  })

  it("warns on empty input", async () => {
    const out = await runEventStoreControlledWrite({ rows: [] })
    expect(out.warnings.some((w) => w.includes("No boundary rows provided for controlled write."))).toBe(
      true,
    )
    expect(out.summary.totalRows).toBe(0)
  })

  it("dry_run still rejects invalid rows", async () => {
    const row = await oneValidBoundaryRow()
    delete row.title
    const out = await runEventStoreControlledWrite({ rows: [row] })
    expect(out.summary.rejectedCount).toBe(1)
  })

  it("accepted/rejected logic matches runEventStoreDryWrite for mixed rows", async () => {
    const good = await oneValidBoundaryRow()
    const bad = structuredClone(good)
    delete bad.description
    const rows = [good, bad]
    const dry = await runEventStoreDryWrite({ rows })
    const ctrl = await runEventStoreControlledWrite({ rows })
    expect(ctrl.accepted).toEqual(dry.accepted)
    expect(ctrl.rejected).toEqual(dry.rejected)
  })

  it("injected writer takes precedence over persistenceAdapter", async () => {
    const row = await oneValidBoundaryRow()
    const adapter: ActionCenterPersistenceAdapter = {
      async listActionItems() {
        return []
      },
      async upsertActionItems() {
        throw new Error("adapter should not run")
      },
      async updateActionItemStatus() {},
      async appendActionItemEvent() {},
    }
    const writer: ControlledWriter = async ({ rows }) => ({
      succeeded: rows.map((r, i) => ({ index: i, clientRef: boundaryRowClientRef(r) })),
      failed: [],
    })
    const out = await runEventStoreControlledWrite({
      rows: [row],
      allowWrite: true,
      writer,
      persistenceAdapter: adapter,
    })
    expect(out.writeResult.succeeded).toBe(1)
    expect(out.writeResult.failed).toBe(0)
  })
})

describe("runEventStoreControlledWrite (memory adapter integration)", () => {
  beforeEach(() => {
    resetMemoryPersistenceAdapterState()
  })

  afterEach(() => {
    resetMemoryPersistenceAdapterState()
  })

  it("allowWrite true with MemoryPersistenceAdapter upserts accepted rows", async () => {
    const row = await oneValidBoundaryRow()
    const adapter = new MemoryPersistenceAdapter()
    const out = await runEventStoreControlledWrite({
      rows: [row],
      allowWrite: true,
      persistenceAdapter: adapter,
    })
    expect(out.mode).toBe("write_attempt")
    expect(out.writeResult.attempted).toBe(true)
    expect(out.writeResult.succeeded).toBe(1)
    expect(out.writeResult.failed).toBe(0)
    const listed = await adapter.listActionItems()
    expect(listed.length).toBe(1)
  })

  it("failing adapter surfaces in notes, failed count, and failure warning", async () => {
    const row = await oneValidBoundaryRow()
    const adapter: ActionCenterPersistenceAdapter = {
      async listActionItems() {
        return []
      },
      async upsertActionItems() {
        throw new Error("upsert_boom")
      },
      async updateActionItemStatus() {},
      async appendActionItemEvent() {},
    }
    const out = await runEventStoreControlledWrite({
      rows: [row],
      allowWrite: true,
      persistenceAdapter: adapter,
    })
    expect(out.writeResult.attempted).toBe(true)
    expect(out.writeResult.succeeded).toBe(0)
    expect(out.writeResult.failed).toBe(1)
    expect(out.writeResult.notes.some((n) => n.includes("upsert_boom"))).toBe(true)
    expect(out.warnings.some((w) => w === "Boundary write attempt reported failures.")).toBe(true)
  })
})
