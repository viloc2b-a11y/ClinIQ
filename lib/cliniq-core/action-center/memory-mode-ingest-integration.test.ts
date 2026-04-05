/**
 * STEP 7 — Default persistence mode is **memory** (`CLINIQ_ACTION_CENTER_PERSISTENCE_MODE` unset or not `supabase`).
 *
 * Validates: bootstrap seeds the shared store → `GET /api/action-center` reads the same persistence →
 * one real `ingestEvent` (`visit_completed`) runs `runActionCenterSyncFromRuntime` / write-through →
 * persisted item set changes (new ids). Supabase persistence adapter must not be used here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const hoisted = vi.hoisted(() => ({
  createSupabasePersistenceAdapter: vi.fn(() => {
    throw new Error("supabase adapter must not be used when persistence mode is memory")
  }),
}))

vi.mock("./supabase-persistence-adapter", () => ({
  createSupabasePersistenceAdapter: hoisted.createSupabasePersistenceAdapter,
}))

import { GET as getActionCenterApi } from "@/app/api/action-center/route"
import { ingestEvent } from "../events/ingest-event"
import type { ExpectedBillable } from "../post-award-ledger/types"
import {
  bootstrapMemoryActionCenter,
  resetMemoryActionCenterBootstrap,
} from "./bootstrap-memory-action-center"
import {
  getActionCenterPersistenceAdapter,
  resetActionCenterPersistenceAdapterCache,
} from "./get-persistence-adapter"
import { getActionCenterFromPersistence } from "./get-action-center-from-persistence"
import {
  MemoryPersistenceAdapter,
  resetMemoryPersistenceAdapterState,
} from "./memory-persistence-adapter"
import { resetMockServerActionCenterState } from "./mock-server-state"

function mockSupabaseInsert(row: Record<string, unknown>) {
  return {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              id: "00000000-0000-4000-8000-00000000aa01",
              study_id: row.study_id,
              subject_id: row.subject_id,
              visit_name: row.visit_name,
              event_type: row.event_type,
              event_date: row.event_date,
              created_at: "2026-04-04T12:00:00.000Z",
            },
            error: null,
          })),
        })),
      })),
    })),
  }
}

/** Two expected rows on the same study: ingest only Visit 1 → Visit 2 row stays `not_generated` and yields a new Action Center item on merge. */
function expectedBillablesForIntegration(studyId: string): ExpectedBillable[] {
  return [
    {
      id: "eb-int-v1",
      budgetLineId: "bl-int-v1",
      studyId,
      lineCode: "VFEE",
      label: "Visit fee",
      category: "Visit",
      visitName: "Visit 1",
      unit: "ea",
      expectedQuantity: 1,
      unitPrice: 400,
      expectedRevenue: 400,
    },
    {
      id: "eb-int-v2",
      budgetLineId: "bl-int-v2",
      studyId,
      lineCode: "UNSCHED",
      label: "Unscheduled visit",
      category: "Visit",
      visitName: "Visit 2",
      unit: "ea",
      expectedQuantity: 1,
      unitPrice: 300,
      expectedRevenue: 300,
    },
  ]
}

describe("memory mode + runtime ingest integration", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    resetMockServerActionCenterState()
    resetMemoryPersistenceAdapterState()
    resetActionCenterPersistenceAdapterCache()
    resetMemoryActionCenterBootstrap()
    hoisted.createSupabasePersistenceAdapter.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("bootstrap seeds persistence; ingest visit_completed refreshes store; GET reads merged items", async () => {
    // 1) Initial state: bootstrap mock pipeline into memory; adapter is MemoryPersistenceAdapter
    await bootstrapMemoryActionCenter()

    const adapter = getActionCenterPersistenceAdapter()
    expect(adapter).toBeInstanceOf(MemoryPersistenceAdapter)

    const seeded = await getActionCenterFromPersistence()
    expect(seeded.ok).toBe(true)
    if (!seeded.ok) return
    expect(seeded.data.items.length).toBeGreaterThan(0)

    const beforeIds = new Set(seeded.data.items.map((i) => i.id))
    const beforeOpen = seeded.data.summary.totalOpen

    // 2) Process one visit_completed (Supabase insert mocked only; sync runs for real)
    const studyId = "S-MEM-INTEGRATION"
    const supabase = mockSupabaseInsert({
      study_id: studyId,
      subject_id: "SUB-INT-1",
      visit_name: "Visit 1",
      event_type: "visit_completed",
      event_date: "2026-04-04T10:00:00.000Z",
    })

    const out = await ingestEvent({
      supabase,
      event: {
        studyId,
        subjectId: "SUB-INT-1",
        visitName: "Visit 1",
        eventType: "visit_completed",
        eventDate: "2026-04-04T10:00:00.000Z",
      },
      expectedBillables: expectedBillablesForIntegration(studyId),
    })

    expect(out.ledgerRows.length).toBeGreaterThan(0)
    expect(out.actionCenterSync).toEqual(
      expect.objectContaining({ ok: true, insertedCount: expect.any(Number) }),
    )
    if (out.actionCenterSync && out.actionCenterSync.ok) {
      expect(
        out.actionCenterSync.insertedCount +
          out.actionCenterSync.updatedCount +
          out.actionCenterSync.unchangedCount,
      ).toBeGreaterThan(0)
    }

    const afterCore = await getActionCenterFromPersistence()
    expect(afterCore.ok).toBe(true)
    if (!afterCore.ok) return

    const afterIds = afterCore.data.items.map((i) => i.id)
    const newIds = afterIds.filter((id) => !beforeIds.has(id))
    // 4) Confirm new or merged items (not_generated path for Visit 2 expected row)
    expect(newIds.length).toBeGreaterThan(0)

    expect(afterCore.data.summary.totalOpen).toBeGreaterThanOrEqual(beforeOpen)

    const res = await getActionCenterApi()
    expect(res.status).toBe(200)
    const json = (await res.json()) as { ok: boolean; data?: { items: { id: string }[] } }
    expect(json.ok).toBe(true)
    const viaRouteIds = new Set((json.data?.items ?? []).map((i) => i.id))
    for (const id of afterIds) {
      expect(viaRouteIds.has(id)).toBe(true)
    }
  })
})
