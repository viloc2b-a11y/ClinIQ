import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resetSupabaseClientCache } from "../integrations/supabase/client"
import { resetAuditLog } from "./audit-log"
import { resetMetrics } from "./metrics"
import { resetPersistenceAdapterCache } from "./persistence/get-adapter"
import { readActionCenterRecords } from "./read-action-center-records"
import { verifyActionCenterRecords } from "./verify-action-center-records"
import { writeActionCenterRecords } from "./write-action-center-records"

describe("verifyActionCenterRecords", () => {
  beforeEach(async () => {
    vi.unstubAllEnvs()
    vi.stubEnv("CLINIQ_ENABLE_REAL_PERSISTENCE", "")
    resetPersistenceAdapterCache()
    await resetMetrics()
    await resetAuditLog()
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    resetPersistenceAdapterCache()
    resetSupabaseClientCache()
    await resetMetrics()
    await resetAuditLog()
  })

  it("warns when expected ids are missing", async () => {
    const v = await verifyActionCenterRecords({ expectedIds: ["ghost"] })
    expect(v.found).toBe(0)
    expect(v.missing).toEqual(["ghost"])
    expect(v.warnings.length).toBe(1)
  })

  it("matches after write", async () => {
    await writeActionCenterRecords([
      { id: "stored-id", type: "t", payload: {}, createdAt: "2020-01-01T00:00:00.000Z" },
    ])
    const v = await verifyActionCenterRecords({ expectedIds: ["t::stored-id"] })
    expect(v.found).toBe(1)
    expect(v.matched).toEqual(["t::stored-id"])
    expect(v.warnings).toEqual([])
  })

  it("returns records in deterministic order", async () => {
    const now = Date.now()

    await writeActionCenterRecords([
      {
        id: "1",
        type: "action_item",
        payload: { id: "A" },
        createdAt: new Date(now).toISOString(),
      },
      {
        id: "2",
        type: "action_item",
        payload: { id: "B" },
        createdAt: new Date(now + 1000).toISOString(),
      },
    ])

    const records = await readActionCenterRecords()

    expect(records.map((r) => r.id)).toEqual(["action_item::A", "action_item::B"])
  })

  it("supports limit and afterId", async () => {
    const now = Date.now()

    await writeActionCenterRecords([
      { id: "1", type: "action_item", payload: { id: "A" }, createdAt: new Date(now).toISOString() },
      { id: "2", type: "action_item", payload: { id: "B" }, createdAt: new Date(now + 1000).toISOString() },
      { id: "3", type: "action_item", payload: { id: "C" }, createdAt: new Date(now + 2000).toISOString() },
    ])

    const first = await readActionCenterRecords({ limit: 1 })

    expect(first.length).toBe(1)

    const next = await readActionCenterRecords({
      afterId: first[0]!.id,
      limit: 2,
    })

    expect(next.map((r) => (r.payload as { id: string }).id)).toEqual(["B", "C"])
  })
})
