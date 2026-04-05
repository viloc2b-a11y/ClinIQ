import { beforeEach, describe, expect, it } from "vitest"

import {
  getActionCenterMetricsStore,
  resetActionCenterMetricsStoreCache,
} from "./get-store"

describe("getActionCenterMetricsStore", () => {
  beforeEach(() => {
    delete process.env.CLINIQ_ENABLE_REAL_METRICS_STORE
    resetActionCenterMetricsStoreCache()
  })

  it("defaults to memory metrics store", () => {
    const store = getActionCenterMetricsStore()
    expect(store.constructor.name).toBe("MemoryActionCenterMetricsStore")
  })

  it("switches to supabase metrics store when flag enabled", () => {
    process.env.CLINIQ_ENABLE_REAL_METRICS_STORE = "true"
    resetActionCenterMetricsStoreCache()

    const store = getActionCenterMetricsStore()
    expect(store.constructor.name).toBe("SupabaseActionCenterMetricsStore")
  })

  it("returns cached metrics store instance", () => {
    const a = getActionCenterMetricsStore()
    const b = getActionCenterMetricsStore()

    expect(a).toBe(b)
  })
})
