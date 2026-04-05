import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const hoisted = vi.hoisted(() => ({
  createSupabasePersistenceAdapter: vi.fn(() => ({ __kind: "supabase-mock" })),
}))

vi.mock("./supabase-persistence-adapter", () => ({
  createSupabasePersistenceAdapter: hoisted.createSupabasePersistenceAdapter,
}))

import {
  bootstrapMemoryActionCenter,
  resetMemoryActionCenterBootstrap,
} from "./bootstrap-memory-action-center"
import { getActionCenter } from "./get-action-center"
import {
  getActionCenterPersistenceAdapter,
  resetActionCenterPersistenceAdapterCache,
} from "./get-persistence-adapter"
import {
  createMemoryPersistenceAdapter,
  MemoryPersistenceAdapter,
  resetMemoryPersistenceAdapterState,
} from "./memory-persistence-adapter"

describe("bootstrapMemoryActionCenter", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    resetMemoryPersistenceAdapterState()
    resetMemoryActionCenterBootstrap()
    resetActionCenterPersistenceAdapterCache()
    hoisted.createSupabasePersistenceAdapter.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("seeds shared memory and registers adapter for getActionCenterPersistenceAdapter", async () => {
    await bootstrapMemoryActionCenter()

    const adapter = getActionCenterPersistenceAdapter()
    const items = await adapter.listActionItems()
    const initial = getActionCenter()
    expect(initial.ok).toBe(true)
    if (!initial.ok) return
    expect(items.length).toBe(initial.data.items.length)
    expect(items.map((i) => i.id).sort()).toEqual(initial.data.items.map((i) => i.id).sort())
  })

  it("second bootstrap call does not re-seed over in-memory changes", async () => {
    await bootstrapMemoryActionCenter()
    const first = await getActionCenterPersistenceAdapter().listActionItems()
    const row = first[0]!
    await getActionCenterPersistenceAdapter().upsertActionItems([{ ...row, status: "resolved" }])
    await bootstrapMemoryActionCenter()
    const after = await getActionCenterPersistenceAdapter().listActionItems()
    expect(after.find((i) => i.id === row.id)?.status).toBe("resolved")
  })

  it("after resetMemoryActionCenterBootstrap, write-through merge preserves status when material unchanged", async () => {
    await bootstrapMemoryActionCenter()
    const first = await getActionCenterPersistenceAdapter().listActionItems()
    const row = first[0]!
    await getActionCenterPersistenceAdapter().upsertActionItems([{ ...row, status: "resolved" }])
    resetMemoryActionCenterBootstrap()
    await bootstrapMemoryActionCenter()
    const after = await getActionCenterPersistenceAdapter().listActionItems()
    expect(after.find((i) => i.id === row.id)?.status).toBe("resolved")
  })

  it("skips when supabase persistence is enabled", async () => {
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "supabase")
    await bootstrapMemoryActionCenter()
    const adapter = getActionCenterPersistenceAdapter()
    expect(adapter).not.toBeInstanceOf(MemoryPersistenceAdapter)
  })

  it("shared memory: separate MemoryPersistenceAdapter instance sees same items after bootstrap", async () => {
    await bootstrapMemoryActionCenter()
    const viaGet = await getActionCenterPersistenceAdapter().listActionItems()
    const viaNew = await createMemoryPersistenceAdapter().listActionItems()
    expect(viaNew.length).toBe(viaGet.length)
    expect(viaNew.map((i) => i.id).sort()).toEqual(viaGet.map((i) => i.id).sort())
  })
})
