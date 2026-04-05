import { beforeEach, describe, expect, it, vi } from "vitest"

import { recomputeActionCenterSummary } from "./recompute-summary"
import type { ActionCenterItem } from "./types"
import { getActionCenterFromPersistence } from "./get-action-center-from-persistence"
import {
  getActionCenterPersistenceAdapter,
  resetActionCenterPersistenceAdapterCache,
} from "./get-persistence-adapter"
import { resetMemoryPersistenceAdapterState } from "./memory-persistence-adapter"

const hoisted = vi.hoisted(() => ({
  actualGet: () =>
    null as unknown as ReturnType<typeof getActionCenterPersistenceAdapter>,
}))

vi.mock("./get-persistence-adapter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./get-persistence-adapter")>()
  hoisted.actualGet = () => mod.getActionCenterPersistenceAdapter()
  return {
    ...mod,
    getActionCenterPersistenceAdapter: vi.fn(() => hoisted.actualGet()),
  }
})

const mockedGetAdapter = vi.mocked(getActionCenterPersistenceAdapter)

function item(overrides: Partial<ActionCenterItem> = {}): ActionCenterItem {
  return {
    id: "i1",
    studyId: "S",
    subjectId: "SUB",
    visitName: "V",
    lineCode: "L",
    actionType: "prepare_invoice",
    ownerRole: "billing",
    priority: "high",
    status: "open",
    title: "T",
    description: "D",
    expectedAmount: 100,
    invoicedAmount: 0,
    missingAmount: 100,
    leakageStatus: "missing",
    leakageReason: "not_invoiced",
    ...overrides,
  }
}

describe("getActionCenterFromPersistence (STEP 8)", () => {
  beforeEach(() => {
    resetMemoryPersistenceAdapterState()
    resetActionCenterPersistenceAdapterCache()
    mockedGetAdapter.mockReset()
    mockedGetAdapter.mockImplementation(() => hoisted.actualGet())
  })

  it("returns ok true from memory adapter", async () => {
    const adapter = hoisted.actualGet()
    await adapter.upsertActionItems([item({ id: "mem-1" })])

    const result = await getActionCenterFromPersistence()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.items).toHaveLength(1)
      expect(result.data.items[0]?.id).toBe("mem-1")
      expect(result.data.summary).toEqual(recomputeActionCenterSummary(result.data.items))
    }
  })

  it("returns ok true with mocked adapter list", async () => {
    const items = [item({ id: "a" }), item({ id: "b", missingAmount: 50 })]
    mockedGetAdapter.mockReturnValue({
      listActionItems: vi.fn().mockResolvedValue(items),
    } as never)

    const result = await getActionCenterFromPersistence()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.items).toBe(items)
    }
  })

  it("returns failure shape when adapter throws", async () => {
    mockedGetAdapter.mockReturnValue({
      listActionItems: vi.fn().mockRejectedValue(new Error("db")),
    } as never)

    const result = await getActionCenterFromPersistence()

    expect(result).toEqual({ ok: false, error: "failed_to_build_action_center" })
  })
})
