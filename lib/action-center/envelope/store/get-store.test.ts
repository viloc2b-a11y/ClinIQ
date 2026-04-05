import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  getOperationEnvelopeStore,
  resetOperationEnvelopeStoreCache,
} from "./get-store"

describe("getOperationEnvelopeStore", () => {
  beforeEach(() => {
    delete process.env.CLINIQ_ENABLE_REAL_ENVELOPE_STORE
    resetOperationEnvelopeStoreCache()
  })

  afterEach(() => {
    delete process.env.CLINIQ_ENABLE_REAL_ENVELOPE_STORE
    resetOperationEnvelopeStoreCache()
  })

  it("defaults to memory store", () => {
    const store = getOperationEnvelopeStore()
    expect(store.constructor.name).toBe("MemoryOperationEnvelopeStore")
  })

  it("switches to supabase store when flag enabled", () => {
    process.env.CLINIQ_ENABLE_REAL_ENVELOPE_STORE = "true"
    resetOperationEnvelopeStoreCache()

    const store = getOperationEnvelopeStore()
    expect(store.constructor.name).toBe("SupabaseOperationEnvelopeStore")
  })

  it("returns cached store instance", () => {
    const a = getOperationEnvelopeStore()
    const b = getOperationEnvelopeStore()

    expect(a).toBe(b)
  })
})
