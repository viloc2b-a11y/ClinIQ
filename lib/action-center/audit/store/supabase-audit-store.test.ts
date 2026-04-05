import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { resetSupabaseClientCache } from "../../../integrations/supabase/client"
import { SupabaseActionCenterAuditStore } from "./supabase-audit-store"

describe("SupabaseActionCenterAuditStore", () => {
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

    const store = new SupabaseActionCenterAuditStore()

    await store.append({
      id: "a",
      step: "write_attempt",
      timestamp: "2026-04-05T00:00:00.000Z",
    })

    const rows = await store.list()
    expect(rows).toEqual([])

    await store.reset()
  })

  it("returns empty page safely without supabase env", async () => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const store = new SupabaseActionCenterAuditStore()

    const page = await store.readPage?.({ limit: 2 })

    expect(page).toEqual({
      records: [],
      nextCursor: null,
    })
  })
})
