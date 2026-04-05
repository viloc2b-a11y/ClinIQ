import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isActionCenterPersistenceEnabled } from "./persistence-feature-flag"

describe("isActionCenterPersistenceEnabled", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("defaults false when env unset", () => {
    expect(isActionCenterPersistenceEnabled()).toBe(false)
  })

  it("is false for non-true values", () => {
    vi.stubEnv("ENABLE_ACTION_CENTER_PERSISTENCE", "false")
    expect(isActionCenterPersistenceEnabled()).toBe(false)
    vi.stubEnv("ENABLE_ACTION_CENTER_PERSISTENCE", "1")
    expect(isActionCenterPersistenceEnabled()).toBe(false)
    vi.stubEnv("ENABLE_ACTION_CENTER_PERSISTENCE", "")
    expect(isActionCenterPersistenceEnabled()).toBe(false)
  })

  it("is true when env is true (case-insensitive, trimmed)", () => {
    vi.stubEnv("ENABLE_ACTION_CENTER_PERSISTENCE", "true")
    expect(isActionCenterPersistenceEnabled()).toBe(true)
    vi.stubEnv("ENABLE_ACTION_CENTER_PERSISTENCE", " TRUE ")
    expect(isActionCenterPersistenceEnabled()).toBe(true)
  })
})
