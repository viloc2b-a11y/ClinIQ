import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resetSupabaseClientCache } from "../../integrations/supabase/client"
import { SupabasePersistenceAdapter } from "./supabase-persistence-adapter"

describe("SupabasePersistenceAdapter", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    resetSupabaseClientCache()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    resetSupabaseClientCache()
  })

  it("does not crash without env (empty write)", async () => {
    vi.stubEnv("SUPABASE_URL", "")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
    resetSupabaseClientCache()

    const adapter = new SupabasePersistenceAdapter()

    const res = await adapter.write([])
    expect(res.written).toBe(0)

    const read = await adapter.readAll()
    expect(read).toEqual([])
  })

  it("returns zero without env", async () => {
    vi.stubEnv("SUPABASE_URL", "")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
    resetSupabaseClientCache()

    const adapter = new SupabasePersistenceAdapter()

    const result = await adapter.write([
      {
        id: "action_item::1",
        type: "action_item",
        payload: { id: "1" },
        createdAt: "2026-04-05T00:00:00.000Z",
      },
    ])

    expect(result).toEqual({ written: 0 })
  })
})
