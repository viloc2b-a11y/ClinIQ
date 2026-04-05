import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resetSupabaseClientCache } from "../integrations/supabase/client"
import { getAuditLog, resetAuditLog } from "./audit-log"
import { getMetrics, resetMetrics } from "./metrics"
import { resetPersistenceAdapterCache } from "./persistence/get-adapter"
import { verifyActionCenterRecords } from "./verify-action-center-records"
import {
  buildDeterministicId,
  writeActionCenterRecords,
} from "./write-action-center-records"

describe("buildDeterministicId", () => {
  it("uses payload.id when present", () => {
    expect(
      buildDeterministicId({
        id: "fallback",
        type: "evt",
        payload: { id: "inner" },
        createdAt: "t",
      }),
    ).toBe("evt::inner")
  })

  it("falls back to record id", () => {
    expect(
      buildDeterministicId({
        id: "rid",
        type: "evt",
        payload: {},
        createdAt: "t",
      }),
    ).toBe("evt::rid")
  })
})

describe("writeActionCenterRecords", () => {
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

  it("dedupes by deterministic id", async () => {
    const r = await writeActionCenterRecords([
      { id: "a", type: "t", payload: { id: "same" }, createdAt: "2020-01-01T00:00:00.000Z" },
      { id: "b", type: "t", payload: { id: "same" }, createdAt: "2020-01-01T00:00:00.000Z" },
    ])
    expect(r).toEqual({
      ok: true,
      partial: false,
      attempted: 1,
      written: 1,
      status: "success",
    })
    expect((await getMetrics()).writesAttempted).toBe(1)
    expect((await getMetrics()).writesSuccess).toBe(1)
    expect((await getMetrics()).writesFailed).toBe(0)
    const audit = await getAuditLog()
    expect(audit.filter((e) => e.step === "write_attempt")).toHaveLength(1)
    expect(audit.filter((e) => e.step === "write_success")).toHaveLength(1)
  })

  it("dedupes repeated logical records before persistence", async () => {
    const now = "2026-04-05T00:00:00.000Z"

    const result = await writeActionCenterRecords([
      {
        id: "raw-1",
        type: "action_item",
        payload: { id: "A" },
        createdAt: now,
      },
      {
        id: "raw-2",
        type: "action_item",
        payload: { id: "A" },
        createdAt: now,
      },
    ])

    expect(result).toEqual({
      ok: true,
      partial: false,
      attempted: 1,
      written: 1,
      status: "success",
    })

    const verify = await verifyActionCenterRecords({
      expectedIds: ["action_item::A"],
    })

    expect(verify.found).toBe(1)
    expect(verify.missing).toEqual([])

    expect(await getMetrics()).toEqual({
      writesAttempted: 1,
      writesSuccess: 1,
      writesFailed: 0,
    })

    expect((await getAuditLog()).map((x) => x.step)).toEqual(["write_attempt", "write_success"])
  })

  it("verify read-back sees persisted ids", async () => {
    await writeActionCenterRecords([
      { id: "x", type: "review", payload: { id: "p1" }, createdAt: "2020-01-01T00:00:00.000Z" },
    ])
    const v = await verifyActionCenterRecords({ expectedIds: ["review::p1"] })
    expect(v.found).toBe(1)
    expect(v.missing).toEqual([])
  })

  it("partial when Supabase adapter cannot write", async () => {
    vi.stubEnv("CLINIQ_ENABLE_REAL_PERSISTENCE", "true")
    vi.stubEnv("SUPABASE_URL", "")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
    resetSupabaseClientCache()
    resetPersistenceAdapterCache()

    const r = await writeActionCenterRecords([
      { id: "only", type: "t", payload: {}, createdAt: "2020-01-01T00:00:00.000Z" },
    ])
    expect(r.ok).toBe(false)
    expect(r.partial).toBe(false)
    expect(r.attempted).toBe(1)
    expect(r.written).toBe(0)
    expect(r.status).toBe("failed")
    expect((await getMetrics()).writesFailed).toBe(1)
    expect((await getAuditLog()).some((e) => e.step === "write_fail")).toBe(true)
  })
})
