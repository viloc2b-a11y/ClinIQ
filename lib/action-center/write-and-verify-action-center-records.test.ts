import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resetSupabaseClientCache } from "../integrations/supabase/client"
import { resetAuditLog } from "./audit-log"
import { resetMetrics } from "./metrics"
import { resetPersistenceAdapterCache } from "./persistence/get-adapter"
import { writeAndVerifyActionCenterRecords } from "./write-and-verify-action-center-records"

describe("writeAndVerifyActionCenterRecords", () => {
  beforeEach(async () => {
    vi.unstubAllEnvs()
    vi.stubEnv("CLINIQ_ENABLE_REAL_PERSISTENCE", "")
    resetPersistenceAdapterCache()
    await resetAuditLog()
    await resetMetrics()
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    resetPersistenceAdapterCache()
    resetSupabaseClientCache()
    await resetAuditLog()
    await resetMetrics()
  })

  it("writes and verifies in full mode", async () => {
    const now = new Date().toISOString()

    const result = await writeAndVerifyActionCenterRecords({
      records: [
        {
          id: "raw-1",
          type: "action_item",
          payload: { id: "A" },
          createdAt: now,
        },
      ],
      mode: "full",
    })

    expect(result).toEqual({
      status: "success",
      write: {
        status: "success",
        ok: true,
        partial: false,
        attempted: 1,
        written: 1,
      },
      verify: {
        status: "success",
        totalExpected: 1,
        found: 1,
        missing: [],
        matched: ["action_item::A"],
        warnings: [],
        mode: "full",
      },
      ok: true,
    })
  })

  it("writes and verifies in paged mode", async () => {
    const now = Date.now()

    const result = await writeAndVerifyActionCenterRecords({
      records: [
        {
          id: "raw-1",
          type: "action_item",
          payload: { id: "A" },
          createdAt: new Date(now).toISOString(),
        },
        {
          id: "raw-2",
          type: "action_item",
          payload: { id: "B" },
          createdAt: new Date(now + 1000).toISOString(),
        },
      ],
      expectedIds: ["action_item::B"],
      mode: "paged",
      pageSize: 1,
    })

    expect(result.write).toEqual({
      status: "success",
      ok: true,
      partial: false,
      attempted: 2,
      written: 2,
    })

    expect(result.verify).toEqual({
      status: "success",
      totalExpected: 1,
      found: 1,
      missing: [],
      matched: ["action_item::B"],
      warnings: [],
      pagesScanned: 2,
      mode: "paged",
    })

    expect(result.status).toBe("success")
    expect(result.ok).toBe(true)
  })

  it("returns ok false when verification misses expected ids", async () => {
    const now = new Date().toISOString()

    const result = await writeAndVerifyActionCenterRecords({
      records: [
        {
          id: "raw-1",
          type: "action_item",
          payload: { id: "A" },
          createdAt: now,
        },
      ],
      expectedIds: ["action_item::A", "action_item::Z"],
      mode: "full",
    })

    expect(result.write.status).toBe("success")
    expect(result.verify.status).toBe("verification_failed")
    expect(result.status).toBe("verification_failed")
    expect(result.ok).toBe(false)
  })
})
