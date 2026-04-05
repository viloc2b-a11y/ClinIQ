import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resetSupabaseClientCache } from "../integrations/supabase/client"
import { resetAuditLog } from "./audit-log"
import { resetMetrics } from "./metrics"
import { resetPersistenceAdapterCache } from "./persistence/get-adapter"
import { readActionCenterRecordsPage } from "./read-action-center-records-page"
import { writeActionCenterRecords } from "./write-action-center-records"

describe("readActionCenterRecordsPage", () => {
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

  it("returns stable nextCursor for paged reads", async () => {
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

    const first = await readActionCenterRecordsPage({ limit: 2 })

    expect(first.records.map((r) => r.id)).toEqual(["action_item::A", "action_item::B"])
    expect(typeof first.nextCursor).toBe("string")

    const second = await readActionCenterRecordsPage({
      limit: 2,
      cursor: first.nextCursor || undefined,
    })

    expect(second.records.map((r) => r.id)).toEqual(["action_item::C"])
    expect(second.nextCursor).toBeNull()
  })
})
