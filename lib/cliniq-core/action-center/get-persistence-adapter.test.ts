import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MemoryPersistenceAdapter } from "./memory-persistence-adapter"
import {
  getActionCenterPersistenceMode,
  isSupabasePersistenceEnabled,
} from "./persistence-config"

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
import { resetMemoryPersistenceAdapterState } from "./memory-persistence-adapter"

describe("getActionCenterPersistenceAdapter", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    resetMemoryPersistenceAdapterState()
    resetActionCenterPersistenceAdapterCache()
    hoisted.createSupabasePersistenceAdapter.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("default mode returns memory adapter", () => {
    const a = getActionCenterPersistenceAdapter()
    const b = getActionCenterPersistenceAdapter()
    expect(a).toBe(b)
    expect(a).toBeInstanceOf(MemoryPersistenceAdapter)
    expect(createSupabasePersistenceAdapter).not.toHaveBeenCalled()
  })

  it("supabase mode returns supabase adapter", () => {
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "supabase")
    const adapter = getActionCenterPersistenceAdapter()
    expect(createSupabasePersistenceAdapter).toHaveBeenCalledTimes(1)
    expect(adapter).toEqual({ __kind: "supabase-mock" })
  })

  it("each supabase call creates a new adapter instance", () => {
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "supabase")
    getActionCenterPersistenceAdapter()
    getActionCenterPersistenceAdapter()
    expect(createSupabasePersistenceAdapter).toHaveBeenCalledTimes(2)
  })
})

describe("getActionCenterPersistenceMode / isSupabasePersistenceEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("mode parsing is deterministic", () => {
    expect(getActionCenterPersistenceMode()).toBe("memory")
    expect(isSupabasePersistenceEnabled()).toBe(false)

    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "  SUPABASE  ")
    expect(getActionCenterPersistenceMode()).toBe("supabase")
    expect(isSupabasePersistenceEnabled()).toBe(true)

    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "SupaBase")
    expect(getActionCenterPersistenceMode()).toBe("supabase")

    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "postgres")
    expect(getActionCenterPersistenceMode()).toBe("memory")
    expect(isSupabasePersistenceEnabled()).toBe(false)
  })
})
