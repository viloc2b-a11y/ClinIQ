import { beforeEach, describe, expect, it } from "vitest"

import {
  getActionCenterAuditStore,
  resetActionCenterAuditStoreCache,
} from "./get-store"

describe("getActionCenterAuditStore", () => {
  beforeEach(() => {
    delete process.env.CLINIQ_ENABLE_REAL_AUDIT_STORE
    resetActionCenterAuditStoreCache()
  })

  it("defaults to memory audit store", () => {
    const store = getActionCenterAuditStore()
    expect(store.constructor.name).toBe("MemoryActionCenterAuditStore")
  })

  it("switches to supabase audit store when flag enabled", () => {
    process.env.CLINIQ_ENABLE_REAL_AUDIT_STORE = "true"
    resetActionCenterAuditStoreCache()

    const store = getActionCenterAuditStore()
    expect(store.constructor.name).toBe("SupabaseActionCenterAuditStore")
  })

  it("returns cached audit store instance", () => {
    const a = getActionCenterAuditStore()
    const b = getActionCenterAuditStore()

    expect(a).toBe(b)
  })
})
