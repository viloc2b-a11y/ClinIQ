import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { resetSupabaseClientCache } from "../../../integrations/supabase/client"
import { SupabaseOperationEnvelopeStore } from "./supabase-operation-envelope-store"

describe("SupabaseOperationEnvelopeStore", () => {
  beforeEach(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    resetSupabaseClientCache()
  })

  afterEach(() => {
    resetSupabaseClientCache()
  })

  it("is safe without supabase env", async () => {
    const store = new SupabaseOperationEnvelopeStore()

    await store.append({
      operationId: "write::2026-04-05T00:00:00.000Z",
      timestamp: "2026-04-05T00:00:00.000Z",
      kind: "write",
      status: "success",
      summary: {
        status: "success",
        ok: true,
        partial: false,
        attempted: 1,
        written: 1,
      },
    })

    const rows = await store.list()
    expect(rows).toEqual([])

    await store.reset()
  })
})
