import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MemoryPersistenceAdapter } from "./memory-persistence-adapter"
import { SupabasePersistenceAdapter } from "./supabase-persistence-adapter"
import { getPersistenceAdapter, resetPersistenceAdapterCache } from "./get-adapter"

describe("getPersistenceAdapter", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    resetPersistenceAdapterCache()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    resetPersistenceAdapterCache()
  })

  it("defaults to memory", () => {
    vi.stubEnv("CLINIQ_ENABLE_REAL_PERSISTENCE", "")
    const adapter = getPersistenceAdapter()
    expect(adapter).toBeInstanceOf(MemoryPersistenceAdapter)
  })

  it("switches to Supabase adapter when flag enabled", () => {
    vi.stubEnv("CLINIQ_ENABLE_REAL_PERSISTENCE", "true")
    const adapter = getPersistenceAdapter()
    expect(adapter).toBeInstanceOf(SupabasePersistenceAdapter)
  })

  it("returns same cached memory instance when flag off", () => {
    vi.stubEnv("CLINIQ_ENABLE_REAL_PERSISTENCE", "")
    const a = getPersistenceAdapter()
    const b = getPersistenceAdapter()
    expect(a).toBe(b)
  })
})
