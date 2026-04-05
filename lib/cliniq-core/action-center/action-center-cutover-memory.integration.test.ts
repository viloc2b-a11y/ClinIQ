/**
 * STEP 9 — Default persistence is memory. This integration-style test runs the same services the app uses:
 * bootstrap → read → mutate → read, and asserts status and summary stay consistent (cutover did not break the flow).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const hoisted = vi.hoisted(() => ({
  createSupabasePersistenceAdapter: vi.fn(() => {
    throw new Error("supabase adapter must not be used when persistence mode is memory")
  }),
}))

vi.mock("./supabase-persistence-adapter", () => ({
  createSupabasePersistenceAdapter: hoisted.createSupabasePersistenceAdapter,
}))

import {
  bootstrapMemoryActionCenter,
  resetMemoryActionCenterBootstrap,
} from "./bootstrap-memory-action-center"
import { getActionCenterFromPersistence } from "./get-action-center-from-persistence"
import { mutateActionCenterFromPersistence } from "./mutate-action-center-from-persistence"
import {
  getActionCenterPersistenceAdapter,
  resetActionCenterPersistenceAdapterCache,
} from "./get-persistence-adapter"
import {
  MemoryPersistenceAdapter,
  resetMemoryPersistenceAdapterState,
} from "./memory-persistence-adapter"
import { resetMockServerActionCenterState } from "./mock-server-state"

describe("action center cutover — memory integration (STEP 9)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "memory")
    resetMockServerActionCenterState()
    resetMemoryPersistenceAdapterState()
    resetActionCenterPersistenceAdapterCache()
    resetMemoryActionCenterBootstrap()
    hoisted.createSupabasePersistenceAdapter.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("bootstrap → read (items exist) → mutate one item → read: status and summary update", async () => {
    await bootstrapMemoryActionCenter()

    expect(getActionCenterPersistenceAdapter()).toBeInstanceOf(MemoryPersistenceAdapter)

    const first = await getActionCenterFromPersistence()
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.data.items.length).toBeGreaterThan(0)

    const target = first.data.items.find((i) => i.status !== "resolved")
    expect(target).toBeDefined()
    if (!target) return

    const beforeStatus = target.status
    const beforeSummary = first.data.summary

    const mut = await mutateActionCenterFromPersistence({
      itemId: target.id,
      action: "mark_resolved",
    })
    expect(mut.ok).toBe(true)
    if (!mut.ok) return

    const itemAfterMutate = mut.data.result.items.find((i) => i.id === target.id)
    expect(itemAfterMutate?.status).toBe("resolved")
    expect(mut.data.result.summary.totalOpen).toBe(beforeSummary.totalOpen - 1)
    expect(mut.data.result.summary.totalMissingAmount).toBe(
      beforeSummary.totalMissingAmount - target.missingAmount,
    )

    const second = await getActionCenterFromPersistence()
    expect(second.ok).toBe(true)
    if (!second.ok) return

    const itemAfterRead = second.data.items.find((i) => i.id === target.id)
    expect(itemAfterRead?.status).toBe("resolved")
    expect(itemAfterRead?.status).not.toBe(beforeStatus)
    expect(second.data.summary).toEqual(mut.data.result.summary)
  })
})
