import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ExpectedBillable } from "../post-award-ledger/types"
import { buildActionCenter } from "./build-action-center"
import { buildLeakageTrace } from "../post-award-ledger/build-leakage-trace"
import {
  getActionCenterPersistenceAdapter,
  resetActionCenterPersistenceAdapterCache,
} from "./get-persistence-adapter"
import { resetMemoryPersistenceAdapterState } from "./memory-persistence-adapter"
import type { ActionCenterItem } from "./types"
import { writeThroughActionCenter } from "./write-through-action-center"
import type { ActionCenterWriteThroughInput } from "./write-through-types"

vi.mock("./get-persistence-adapter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./get-persistence-adapter")>()
  return {
    ...mod,
    getActionCenterPersistenceAdapter: vi.fn(),
  }
})

const mockedGetAdapter = vi.mocked(getActionCenterPersistenceAdapter)

function sampleLedger() {
  return {
    studyId: "S-WT",
    eventDate: "2026-01-10T12:00:00.000Z",
    lineCode: "LINE-WT",
    label: "Visit",
    amount: 250,
    approved: true,
    subjectId: "SUB-1",
    visitName: "Visit WT",
    billableInstanceId: "bill-wt",
    eventLogId: "evt-wt",
    supportDocumentationComplete: true,
  }
}

function sampleExpected(overrides: Partial<ExpectedBillable> = {}): ExpectedBillable {
  return {
    id: "eb-wt",
    budgetLineId: "bl-wt",
    studyId: "S-WT",
    lineCode: "LINE-WT",
    label: "Line",
    category: "Visit",
    visitName: "Visit WT",
    unit: "ea",
    expectedQuantity: 1,
    unitPrice: 250,
    expectedRevenue: 250,
    ...overrides,
  }
}

function baseInput(overrides: Partial<ActionCenterWriteThroughInput> = {}): ActionCenterWriteThroughInput {
  return {
    expectedBillables: [sampleExpected()],
    ledgerRows: [sampleLedger()],
    ...overrides,
  }
}

function expectedGeneratedItems(input: ActionCenterWriteThroughInput) {
  const trace = buildLeakageTrace({
    expectedBillables: input.expectedBillables,
    ledgerRows: input.ledgerRows,
    claimItems: input.claimItems,
    invoicePackages: input.invoicePackages,
  })
  return buildActionCenter({ leakageTrace: trace }).items
}

describe("writeThroughActionCenter", () => {
  let store: ActionCenterItem[]
  let listActionItems: ReturnType<typeof vi.fn>
  let upsertActionItems: ReturnType<typeof vi.fn>
  let appendActionItemEvent: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.unstubAllEnvs()
    resetMemoryPersistenceAdapterState()
    resetActionCenterPersistenceAdapterCache()
    store = []
    listActionItems = vi.fn().mockImplementation(() => Promise.resolve([...store]))
    upsertActionItems = vi.fn().mockImplementation(async (items: ActionCenterItem[]) => {
      for (const it of items) {
        const ix = store.findIndex((x) => x.id === it.id)
        if (ix >= 0) store[ix] = { ...it }
        else store.push({ ...it })
      }
    })
    appendActionItemEvent = vi.fn().mockResolvedValue(undefined)
    mockedGetAdapter.mockReturnValue({
      listActionItems,
      upsertActionItems,
      appendActionItemEvent,
      updateActionItemStatus: vi.fn().mockResolvedValue(undefined),
    } as never)
  })

  it("builds leakage + action center and upserts new items", async () => {
    const input = baseInput()
    const wantItems = expectedGeneratedItems(input)
    await writeThroughActionCenter(input)
    expect(upsertActionItems).toHaveBeenCalledTimes(1)
    expect(upsertActionItems.mock.calls[0]![0]).toEqual(wantItems)
    expect(store).toEqual(wantItems)
    expect(appendActionItemEvent).toHaveBeenCalledTimes(wantItems.length)
  })

  it("returns correct inserted/updated/unchanged counts", async () => {
    const input = baseInput({
      expectedBillables: [sampleExpected(), sampleExpected({ id: "eb-2", lineCode: "LINE-2", visitName: "V2" })],
      ledgerRows: [
        sampleLedger(),
        {
          ...sampleLedger(),
          lineCode: "LINE-2",
          visitName: "V2",
          subjectId: "SUB-2",
        },
      ],
    })
    const first = await writeThroughActionCenter(input)
    expect(first.insertedCount).toBe(2)
    expect(first.updatedCount).toBe(0)
    expect(first.unchangedCount).toBe(0)

    const second = await writeThroughActionCenter(input)
    expect(second.insertedCount).toBe(0)
    expect(second.updatedCount).toBe(0)
    expect(second.unchangedCount).toBe(2)
  })

  it("does not upsert when all generated items are unchanged", async () => {
    const input = baseInput()
    await writeThroughActionCenter(input)
    upsertActionItems.mockClear()
    appendActionItemEvent.mockClear()
    await writeThroughActionCenter(input)
    expect(upsertActionItems).not.toHaveBeenCalled()
    expect(appendActionItemEvent).not.toHaveBeenCalled()
  })

  it("preserves in_progress status on existing persisted item", async () => {
    const input = baseInput()
    await writeThroughActionCenter(input)
    const row = store[0]!
    store[0] = { ...row, status: "in_progress" }
    upsertActionItems.mockClear()
    await writeThroughActionCenter(input)
    expect(upsertActionItems).not.toHaveBeenCalled()
    expect(store[0]!.status).toBe("in_progress")
  })

  it("preserves resolved status on existing persisted item", async () => {
    const input = baseInput()
    await writeThroughActionCenter(input)
    const row = store[0]!
    store[0] = { ...row, status: "resolved" }
    upsertActionItems.mockClear()
    await writeThroughActionCenter(input)
    expect(upsertActionItems).not.toHaveBeenCalled()
    expect(store[0]!.status).toBe("resolved")
  })

  it("throws with failed_to_write_through_action_center when listActionItems fails", async () => {
    listActionItems.mockRejectedValueOnce(new Error("db down"))
    await expect(writeThroughActionCenter(baseInput())).rejects.toThrow(
      "failed_to_write_through_action_center",
    )
  })

  it("throws with failed_to_write_through_action_center when upsertActionItems fails", async () => {
    upsertActionItems.mockRejectedValueOnce(new Error("write fail"))
    await expect(writeThroughActionCenter(baseInput())).rejects.toThrow(
      "failed_to_write_through_action_center",
    )
  })

  it("deterministic output for same input", async () => {
    const input = baseInput()
    const a = await writeThroughActionCenter(input)
    store.length = 0
    const b = await writeThroughActionCenter(input)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
