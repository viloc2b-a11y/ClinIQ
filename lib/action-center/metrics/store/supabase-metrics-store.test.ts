import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { resetSupabaseClientCache } from "../../../integrations/supabase/client"
import { SupabaseActionCenterMetricsStore } from "./supabase-metrics-store"

describe("SupabaseActionCenterMetricsStore", () => {
  beforeEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    resetSupabaseClientCache()
  })

  afterEach(() => {
    resetSupabaseClientCache()
  })

  it("is safe without supabase env", async () => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const store = new SupabaseActionCenterMetricsStore()

    expect(await store.get()).toEqual({
      writesAttempted: 0,
      writesSuccess: 0,
      writesFailed: 0,
    })

    await store.set({
      writesAttempted: 5,
      writesSuccess: 4,
      writesFailed: 1,
    })

    expect(await store.get()).toEqual({
      writesAttempted: 0,
      writesSuccess: 0,
      writesFailed: 0,
    })

    await store.reset()

    expect(await store.get()).toEqual({
      writesAttempted: 0,
      writesSuccess: 0,
      writesFailed: 0,
    })
  })
})
