import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MemoryPersistenceAdapter } from "./memory-persistence-adapter"
import { resetMemoryPersistenceAdapterState } from "./memory-persistence-adapter"

const hoisted = vi.hoisted(() => ({
  createSupabasePersistenceAdapter: vi.fn(() => ({ __kind: "supabase-mock" })),
}))

vi.mock("./supabase-persistence-adapter", () => ({
  createSupabasePersistenceAdapter: hoisted.createSupabasePersistenceAdapter,
}))

import { createSupabasePersistenceAdapter } from "./supabase-persistence-adapter"
import {
  getActionCenterPersistenceAdapter,
  resetActionCenterPersistenceAdapterCache,
} from "./get-persistence-adapter"

describe("getActionCenterPersistenceAdapter (STEP 8)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    resetMemoryPersistenceAdapterState()
    resetActionCenterPersistenceAdapterCache()
    hoisted.createSupabasePersistenceAdapter.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("memory mode returns memory adapter", () => {
    const a = getActionCenterPersistenceAdapter()
    expect(a).toBeInstanceOf(MemoryPersistenceAdapter)
    expect(createSupabasePersistenceAdapter).not.toHaveBeenCalled()
  })

  it("supabase mode returns supabase adapter", () => {
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "supabase")
    const adapter = getActionCenterPersistenceAdapter()
    expect(createSupabasePersistenceAdapter).toHaveBeenCalledTimes(1)
    expect(adapter).toEqual({ __kind: "supabase-mock" })
  })

  it("memory adapter is cached", () => {
    const a = getActionCenterPersistenceAdapter()
    const b = getActionCenterPersistenceAdapter()
    expect(a).toBe(b)
    expect(a).toBeInstanceOf(MemoryPersistenceAdapter)
  })

  it("each supabase call creates a new adapter instance", () => {
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "supabase")
    getActionCenterPersistenceAdapter()
    getActionCenterPersistenceAdapter()
    expect(createSupabasePersistenceAdapter).toHaveBeenCalledTimes(2)
  })

  it("supabase adapter is created without mutating memory state", async () => {
    const mem = getActionCenterPersistenceAdapter()
    await mem.upsertActionItems([
      {
        id: "seed-mem",
        studyId: "S",
        subjectId: "SUB",
        visitName: "V",
        lineCode: "L",
        actionType: "prepare_invoice",
        ownerRole: "billing",
        priority: "medium",
        status: "open",
        title: "T",
        description: "D",
        expectedAmount: 1,
        invoicedAmount: 0,
        missingAmount: 1,
        leakageStatus: "missing",
        leakageReason: "not_invoiced",
      },
    ])

    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "supabase")
    getActionCenterPersistenceAdapter()
    vi.unstubAllEnvs()

    resetActionCenterPersistenceAdapterCache()
    const memAgain = getActionCenterPersistenceAdapter()
    const items = await memAgain.listActionItems()
    expect(items.some((i) => i.id === "seed-mem")).toBe(true)
  })
})
