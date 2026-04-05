import { beforeEach, describe, expect, it, vi } from "vitest"

import { recomputeActionCenterSummary } from "./recompute-summary"
import type { ActionCenterItem } from "./types"
import { getActionCenterFromPersistence } from "./get-action-center-from-persistence"
import {
  getActionCenterPersistenceAdapter,
  resetActionCenterPersistenceAdapterCache,
} from "./get-persistence-adapter"
import { resetMemoryPersistenceAdapterState } from "./memory-persistence-adapter"

vi.mock("./get-persistence-adapter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./get-persistence-adapter")>()
  return {
    ...mod,
    getActionCenterPersistenceAdapter: vi.fn(),
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

describe("getActionCenterFromPersistence", () => {
  beforeEach(() => {
    resetMemoryPersistenceAdapterState()
    resetActionCenterPersistenceAdapterCache()
    mockedGetAdapter.mockReset()
  })

  it("returns ok true with items from adapter", async () => {
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

  it("recomputes summary correctly", async () => {
    const items = [item({ id: "a", priority: "high", missingAmount: 10 })]
    mockedGetAdapter.mockReturnValue({
      listActionItems: vi.fn().mockResolvedValue(items),
    } as never)

    const result = await getActionCenterFromPersistence()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.summary).toEqual(recomputeActionCenterSummary(items))
    }
  })

  it("returns failure shape on adapter error", async () => {
    mockedGetAdapter.mockReturnValue({
      listActionItems: vi.fn().mockRejectedValue(new Error("db")),
    } as never)

    const result = await getActionCenterFromPersistence()

    expect(result).toEqual({ ok: false, error: "failed_to_build_action_center" })
  })
})
