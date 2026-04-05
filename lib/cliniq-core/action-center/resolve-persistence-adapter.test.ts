import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MemoryPersistenceAdapter } from "./memory-persistence-adapter"
import { resetMemoryPersistenceAdapterState } from "./memory-persistence-adapter"

const hoisted = vi.hoisted(() => ({
  createSupabasePersistenceAdapter: vi.fn(() => ({ __kind: "supabase-adapter" })),
}))

vi.mock("./supabase-persistence-adapter", () => ({
  createSupabasePersistenceAdapter: hoisted.createSupabasePersistenceAdapter,
}))

import { createSupabasePersistenceAdapter } from "./supabase-persistence-adapter"
import {
  RESOLVE_ADAPTER_ERROR,
  resolveActionCenterPersistenceAdapter,
} from "./resolve-persistence-adapter"

describe("resolveActionCenterPersistenceAdapter", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    resetMemoryPersistenceAdapterState()
    hoisted.createSupabasePersistenceAdapter.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns MemoryPersistenceAdapter when feature flag is false", () => {
    const a = resolveActionCenterPersistenceAdapter()
    expect(a).toBeInstanceOf(MemoryPersistenceAdapter)
    expect(createSupabasePersistenceAdapter).not.toHaveBeenCalled()
  })

  it("throws when flag true but persistence mode is not supabase", () => {
    vi.stubEnv("ENABLE_ACTION_CENTER_PERSISTENCE", "true")
    expect(() => resolveActionCenterPersistenceAdapter()).toThrow(
      RESOLVE_ADAPTER_ERROR.requiresSupabaseMode,
    )
    expect(createSupabasePersistenceAdapter).not.toHaveBeenCalled()
  })

  it("returns Supabase adapter when flag true and CLINIQ_ACTION_CENTER_PERSISTENCE_MODE=supabase", () => {
    vi.stubEnv("ENABLE_ACTION_CENTER_PERSISTENCE", "true")
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "supabase")
    const a = resolveActionCenterPersistenceAdapter()
    expect(createSupabasePersistenceAdapter).toHaveBeenCalledTimes(1)
    expect(a).toEqual({ __kind: "supabase-adapter" })
  })
})
