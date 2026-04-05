import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resetSupabaseClientCache } from "../integrations/supabase/client"
import { resetAuditLog } from "./audit-log"
import { resetMetrics } from "./metrics"
import { resetPersistenceAdapterCache } from "./persistence/get-adapter"
import { verifyActionCenterRecordsUnified } from "./verify-action-center-records-unified"
import { writeActionCenterRecords } from "./write-action-center-records"

describe("verifyActionCenterRecordsUnified", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv("CLINIQ_ENABLE_REAL_PERSISTENCE", "")
    resetPersistenceAdapterCache()
    resetAuditLog()
    resetMetrics()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    resetPersistenceAdapterCache()
    resetSupabaseClientCache()
    resetAuditLog()
    resetMetrics()
  })

  it("supports full mode", async () => {
    const now = new Date().toISOString()

    await writeActionCenterRecords([
      {
        id: "raw-1",
        type: "action_item",
        payload: { id: "A" },
        createdAt: now,
      },
    ])

    const result = await verifyActionCenterRecordsUnified({
      expectedIds: ["action_item::A"],
      mode: "full",
    })

    expect(result).toEqual({
      status: "success",
      totalExpected: 1,
      found: 1,
      missing: [],
      matched: ["action_item::A"],
      warnings: [],
      mode: "full",
    })
  })

  it("supports paged mode", async () => {
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
    ])

    const result = await verifyActionCenterRecordsUnified({
      expectedIds: ["action_item::B"],
      mode: "paged",
      pageSize: 1,
    })

    expect(result).toEqual({
      status: "success",
      totalExpected: 1,
      found: 1,
      missing: [],
      matched: ["action_item::B"],
      warnings: [],
      pagesScanned: 2,
      mode: "paged",
    })
  })
})
