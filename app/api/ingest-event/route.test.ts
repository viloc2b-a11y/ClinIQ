/**
 * HTTP v1: `POST` returns 200 + `{ ok: true, ...result }` when `ingestEvent` resolves.
 * Sync warning: `actionCenterSync.ok === false` still 200. Core throw from `ingestEvent` → 500 + `{ ok: false }`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ingestEventMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/cliniq-core/events/ingest-event", () => ({
  ingestEvent: ingestEventMock,
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({})),
}))

import { POST } from "./route"

const minimalExpectedBillable = {
  id: "eb-1",
  budgetLineId: "bl-1",
  studyId: "S-1",
  lineCode: "V1",
  label: "Visit fee",
  category: "Visit",
  visitName: "Visit 1",
  unit: "ea",
  expectedQuantity: 1,
  unitPrice: 500,
  expectedRevenue: 500,
}

describe("POST /api/ingest-event", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
    ingestEventMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  function postBody(overrides: { eventType?: string } = {}) {
    return {
      event: {
        studyId: "S-1",
        subjectId: "SUB-001",
        visitName: "Visit 1",
        eventType: overrides.eventType ?? "visit_completed",
        eventDate: "2026-04-04T10:00:00.000Z",
      },
      expectedBillables: [minimalExpectedBillable],
    }
  }

  it("returns 200 and includes actionCenterSync count metadata when ingest provides it", async () => {
    ingestEventMock.mockResolvedValue({
      event: { id: "row-1", study_id: "S-1" },
      billables: [],
      ledgerRows: [],
      claimItems: [],
      invoice: {} as never,
      leakage: {} as never,
      actionCenterSync: {
        ok: true,
        insertedCount: 2,
        updatedCount: 1,
        unchangedCount: 3,
      },
    })

    const res = await POST(
      new Request("http://localhost/api/ingest-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody()),
      }),
    )

    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.ok).toBe(true)
    expect(json.event).toEqual({ id: "row-1", study_id: "S-1" })
    const sync = json.actionCenterSync as Record<string, unknown>
    expect(sync.ok).toBe(true)
    expect(sync.insertedCount).toBe(2)
    expect(sync.updatedCount).toBe(1)
    expect(sync.unchangedCount).toBe(3)
  })

  it("preserves top-level ok true when actionCenterSync reports sync failure (additive v1)", async () => {
    ingestEventMock.mockResolvedValue({
      event: { id: "row-1" },
      billables: [],
      ledgerRows: [],
      claimItems: [],
      invoice: {} as never,
      leakage: {} as never,
      actionCenterSync: { ok: false, error: "failed_to_write_through_action_center" },
    })

    const res = await POST(
      new Request("http://localhost/api/ingest-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody()),
      }),
    )

    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.ok).toBe(true)
    expect(json.actionCenterSync).toEqual({
      ok: false,
      error: "failed_to_write_through_action_center",
    })
  })

  it("returns 500 when core ingest throws (atomic failure for event_log + pipeline)", async () => {
    ingestEventMock.mockRejectedValue(new Error("Failed to insert event_log: rls"))

    const res = await POST(
      new Request("http://localhost/api/ingest-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody()),
      }),
    )

    expect(res.status).toBe(500)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.ok).toBe(false)
    expect(String(json.error)).toContain("Failed to insert event_log")
  })

  it("omits actionCenterSync key in JSON when ingest returns undefined (non-visit path)", async () => {
    ingestEventMock.mockResolvedValue({
      event: { id: "row-1" },
      billables: [],
      ledgerRows: [],
      claimItems: [],
      invoice: {} as never,
      leakage: {} as never,
    })

    const res = await POST(
      new Request("http://localhost/api/ingest-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody({ eventType: "startup_completed" })),
      }),
    )

    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.ok).toBe(true)
    expect("actionCenterSync" in json).toBe(false)
  })
})
