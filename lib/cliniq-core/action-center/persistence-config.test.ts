import { afterEach, describe, expect, it, vi } from "vitest"

import {
  getActionCenterPersistenceMode,
  isSupabasePersistenceEnabled,
} from "./persistence-config"

describe("persistence-config (STEP 8)", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("default mode is memory when env unset", () => {
    expect(getActionCenterPersistenceMode()).toBe("memory")
    expect(isSupabasePersistenceEnabled()).toBe(false)
  })

  it("explicit memory stays memory", () => {
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "memory")
    expect(getActionCenterPersistenceMode()).toBe("memory")
    expect(isSupabasePersistenceEnabled()).toBe(false)

    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "  MEMORY  ")
    expect(getActionCenterPersistenceMode()).toBe("memory")
    expect(isSupabasePersistenceEnabled()).toBe(false)
  })

  it("explicit supabase switches to supabase", () => {
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "supabase")
    expect(getActionCenterPersistenceMode()).toBe("supabase")
    expect(isSupabasePersistenceEnabled()).toBe(true)

    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "  SUPABASE  ")
    expect(getActionCenterPersistenceMode()).toBe("supabase")
    expect(isSupabasePersistenceEnabled()).toBe(true)
  })

  it("unknown values fall back to memory", () => {
    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "postgres")
    expect(getActionCenterPersistenceMode()).toBe("memory")
    expect(isSupabasePersistenceEnabled()).toBe(false)

    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "auto")
    expect(getActionCenterPersistenceMode()).toBe("memory")

    vi.stubEnv("CLINIQ_ACTION_CENTER_PERSISTENCE_MODE", "")
    expect(getActionCenterPersistenceMode()).toBe("memory")
  })
})
