import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resetSupabaseClientCache } from "../integrations/supabase/client"
import { resetAuditLog } from "./audit-log"
import { resetMetrics } from "./metrics"
import { resetPersistenceAdapterCache } from "./persistence/get-adapter"
import { verifyActionCenterRecordsPaged } from "./verify-action-center-records-paged"
import { writeActionCenterRecords } from "./write-action-center-records"

describe("verifyActionCenterRecordsPaged", () => {
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

  it("verifies expected ids across multiple pages", async () => {
    const now = Date.now()

    await writeActionCenterRecords([
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
      {
        id: "raw-3",
        type: "action_item",
        payload: { id: "C" },
        createdAt: new Date(now + 2000).toISOString(),
      },
    ])

    const result = await verifyActionCenterRecordsPaged({
      expectedIds: ["action_item::A", "action_item::C"],
      pageSize: 1,
    })

    expect(result).toEqual({
      totalExpected: 2,
      found: 2,
      missing: [],
      matched: ["action_item::A", "action_item::C"],
      warnings: [],
      pagesScanned: 3,
    })
  })

  it("stops with missing ids when records are not found", async () => {
    const now = Date.now()

    await writeActionCenterRecords([
      {
        id: "raw-1",
        type: "action_item",
        payload: { id: "A" },
        createdAt: new Date(now).toISOString(),
      },
    ])

    const result = await verifyActionCenterRecordsPaged({
      expectedIds: ["action_item::A", "action_item::Z"],
      pageSize: 1,
    })

    expect(result).toEqual({
      totalExpected: 2,
      found: 1,
      missing: ["action_item::Z"],
      matched: ["action_item::A"],
      warnings: ["Some expected action items were not found in Action Center."],
      pagesScanned: 1,
    })
  })

  it("stops early once all expected ids are found", async () => {
    const now = Date.now()

    await writeActionCenterRecords([
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
      {
        id: "raw-3",
        type: "action_item",
        payload: { id: "C" },
        createdAt: new Date(now + 2000).toISOString(),
      },
    ])

    const result = await verifyActionCenterRecordsPaged({
      expectedIds: ["action_item::A"],
      pageSize: 1,
    })

    expect(result.pagesScanned).toBe(1)
    expect(result.found).toBe(1)
    expect(result.missing).toEqual([])
  })
})
