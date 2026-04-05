/**
 * v1 contract (STEP 4): core `event_log` failure → `ingestEvent` throws. Action Center sync failure →
 * `ingestEvent` still resolves with `actionCenterSync: { ok: false, error }`. Non-visit events → no sync.
 *
 * STEP 6: nested describe exercises Action Center hook via mocked `runActionCenterSyncFromRuntime` (no Supabase).
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const hoisted = vi.hoisted(() => ({
  runActionCenterSyncFromRuntime: vi.fn(),
}))

vi.mock("../action-center/run-action-center-sync-from-runtime", () => ({
  runActionCenterSyncFromRuntime: hoisted.runActionCenterSyncFromRuntime,
}))

import { buildInvoicePackage } from "../claims/build-claims"
import { runActionCenterSyncFromRuntime } from "../action-center/run-action-center-sync-from-runtime"
import { ingestEvent, resolveLineCodeForIngest } from "./ingest-event"
import type { ExpectedBillable } from "../post-award-ledger/types"

const expectedForVisit1: ExpectedBillable[] = [
  {
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
  },
]

function mockSupabaseInsert(row: Record<string, unknown>) {
  return {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              id: "00000000-0000-4000-8000-000000000001",
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

describe("resolveLineCodeForIngest", () => {
  it("matches visitName with deterministic tie-break", () => {
    const expected: ExpectedBillable[] = [
      { ...expectedForVisit1[0], lineCode: "Z" },
      { ...expectedForVisit1[0], id: "eb-2", lineCode: "A" },
    ]
    expect(
      resolveLineCodeForIngest(
        {
          studyId: "S",
          subjectId: "SUB",
          visitName: "Visit 1",
          eventType: "visit_completed",
          eventDate: "2026-04-04T10:00:00.000Z",
        },
        expected,
      ),
    ).toBe("A")
  })

  it("falls back to sole expected row when visitName does not match", () => {
    expect(
      resolveLineCodeForIngest(
        {
          studyId: "S",
          subjectId: "SUB",
          visitName: "Other",
          eventType: "visit_completed",
          eventDate: "2026-04-04T10:00:00.000Z",
        },
        expectedForVisit1,
      ),
    ).toBe("V1")
  })

  it("returns empty when no visit match and multiple expected rows", () => {
    const two: ExpectedBillable[] = [
      { ...expectedForVisit1[0], id: "a", lineCode: "A", visitName: "V-A" },
      { ...expectedForVisit1[0], id: "b", lineCode: "B", visitName: "V-B" },
    ]
    expect(
      resolveLineCodeForIngest(
        {
          studyId: "S",
          subjectId: "SUB",
          visitName: "Other",
          eventType: "visit_completed",
          eventDate: "2026-04-04T10:00:00.000Z",
        },
        two,
      ),
    ).toBe("")
  })
})

const mockedRunActionCenterSync = vi.mocked(runActionCenterSyncFromRuntime)

describe("ingestEvent", () => {
  beforeEach(() => {
    hoisted.runActionCenterSyncFromRuntime.mockReset()
    hoisted.runActionCenterSyncFromRuntime.mockResolvedValue({
      items: [],
      insertedCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
    })
  })

  describe("STEP 6: Action Center sync hook (mocked runActionCenterSyncFromRuntime, no Supabase)", () => {
  it("runs pipeline: insert, billables, ledger, claims, invoice, leakage", async () => {
    const supabase = mockSupabaseInsert({
      study_id: "S-1",
      subject_id: "SUB-001",
      visit_name: "Visit 1",
      event_type: "visit_completed",
      event_date: "2026-04-04T10:00:00.000Z",
    })

    const out = await ingestEvent({
      supabase,
      event: {
        studyId: "S-1",
        subjectId: "SUB-001",
        visitName: "Visit 1",
        eventType: "visit_completed",
        eventDate: "2026-04-04T10:00:00.000Z",
      },
      expectedBillables: expectedForVisit1,
    })

    expect(out.event).toMatchObject({
      study_id: "S-1",
      subject_id: "SUB-001",
      visit_name: "Visit 1",
    })
    expect(out.billables.length).toBe(1)
    expect(out.billables[0].lineCode).toBe("V1")
    expect(out.billables[0].totalAmount).toBe(500)
    expect(out.ledgerRows).toHaveLength(1)
    expect(out.claimItems).toHaveLength(1)
    expect(out.invoice.subtotal).toBeGreaterThan(0)
    expect(out.invoice.lineCount).toBeGreaterThan(0)
    expect(out.leakage.totalExpected).toBeGreaterThanOrEqual(0)
    expect(supabase.from).toHaveBeenCalledWith("event_log")
    expect(mockedRunActionCenterSync).toHaveBeenCalledTimes(1)
    expect(mockedRunActionCenterSync).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedBillables: expectedForVisit1,
        ledgerRows: out.ledgerRows,
        claimItems: out.claimItems,
      }),
    )
    expect(out.actionCenterSync).toEqual({
      ok: true,
      insertedCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
    })
    if (out.actionCenterSync && out.actionCenterSync.ok === true) {
      expect(typeof out.actionCenterSync.insertedCount).toBe("number")
      expect(typeof out.actionCenterSync.updatedCount).toBe("number")
      expect(typeof out.actionCenterSync.unchangedCount).toBe("number")
    }
  })

  it("Action Center sync receives expectedBillables and downstream ledger, claims, invoice packages", async () => {
    const supabase = mockSupabaseInsert({
      study_id: "S-1",
      subject_id: "SUB-001",
      visit_name: "Visit 1",
      event_type: "visit_completed",
      event_date: "2026-04-04T10:00:00.000Z",
    })

    let syncArgs: unknown
    hoisted.runActionCenterSyncFromRuntime.mockImplementation(async (p) => {
      syncArgs = p
      return { items: [], insertedCount: 0, updatedCount: 0, unchangedCount: 0 }
    })

    const out = await ingestEvent({
      supabase,
      event: {
        studyId: "S-1",
        subjectId: "SUB-001",
        visitName: "Visit 1",
        eventType: "visit_completed",
        eventDate: "2026-04-04T10:00:00.000Z",
      },
      expectedBillables: expectedForVisit1,
    })

    const args = syncArgs as {
      expectedBillables: ExpectedBillable[]
      ledgerRows: unknown
      claimItems: unknown
      invoicePackages: unknown
    }
    expect(args.expectedBillables).toBe(expectedForVisit1)
    expect(args.ledgerRows).toEqual(out.ledgerRows)
    expect(args.claimItems).toEqual(out.claimItems)
    const built = buildInvoicePackage({ claimItems: out.claimItems })
    const expectedPackages = built.length > 0 ? built : [out.invoice]
    const omitGeneratedAt = <T extends { generatedAt?: string }>(p: T) => {
      const { generatedAt: _g, ...rest } = p
      return rest
    }
    expect(
      (args.invoicePackages as { generatedAt?: string }[]).map(omitGeneratedAt),
    ).toEqual(expectedPackages.map(omitGeneratedAt))
  })

  it("omits ledgerRows and claimItems from sync payload when pipeline produced none; still exactly one sync call", async () => {
    hoisted.runActionCenterSyncFromRuntime.mockClear()
    const supabase = mockSupabaseInsert({
      study_id: "S-1",
      subject_id: "SUB-001",
      visit_name: "Other",
      event_type: "visit_completed",
      event_date: "2026-04-04T10:00:00.000Z",
    })

    const twoMismatched: ExpectedBillable[] = [
      { ...expectedForVisit1[0], id: "eb-a", lineCode: "A", visitName: "V-A" },
      { ...expectedForVisit1[0], id: "eb-b", lineCode: "B", visitName: "V-B" },
    ]

    await ingestEvent({
      supabase,
      event: {
        studyId: "S-1",
        subjectId: "SUB-001",
        visitName: "Other",
        eventType: "visit_completed",
        eventDate: "2026-04-04T10:00:00.000Z",
      },
      expectedBillables: twoMismatched,
    })

    expect(mockedRunActionCenterSync).toHaveBeenCalledTimes(1)
    const arg = mockedRunActionCenterSync.mock.calls[0]![0] as Record<string, unknown>
    expect(arg.expectedBillables).toBe(twoMismatched)
    expect(arg.ledgerRows).toBeUndefined()
    expect(arg.claimItems).toBeUndefined()
    expect(Array.isArray(arg.invoicePackages)).toBe(true)
  })

  it("one visit_completed ingest invokes Action Center sync exactly once", async () => {
    hoisted.runActionCenterSyncFromRuntime.mockClear()
    const supabase = mockSupabaseInsert({
      study_id: "S-1",
      subject_id: "SUB-001",
      visit_name: "Visit 1",
      event_type: "visit_completed",
      event_date: "2026-04-04T10:00:00.000Z",
    })

    await ingestEvent({
      supabase,
      event: {
        studyId: "S-1",
        subjectId: "SUB-001",
        visitName: "Visit 1",
        eventType: "visit_completed",
        eventDate: "2026-04-04T10:00:00.000Z",
      },
      expectedBillables: expectedForVisit1,
    })

    expect(mockedRunActionCenterSync).toHaveBeenCalledTimes(1)
  })

  it("v1: Action Center sync failure is additive — ingest still succeeds with actionCenterSync ok false", async () => {
    hoisted.runActionCenterSyncFromRuntime.mockClear()
    hoisted.runActionCenterSyncFromRuntime.mockRejectedValue(
      new Error("failed_to_write_through_action_center"),
    )

    const supabase = mockSupabaseInsert({
      study_id: "S-1",
      subject_id: "SUB-001",
      visit_name: "Visit 1",
      event_type: "visit_completed",
      event_date: "2026-04-04T10:00:00.000Z",
    })

    const out = await ingestEvent({
      supabase,
      event: {
        studyId: "S-1",
        subjectId: "SUB-001",
        visitName: "Visit 1",
        eventType: "visit_completed",
        eventDate: "2026-04-04T10:00:00.000Z",
      },
      expectedBillables: expectedForVisit1,
    })

    expect(out.event).toMatchObject({ study_id: "S-1" })
    expect(out.billables).toHaveLength(1)
    expect(out.actionCenterSync).toEqual({
      ok: false,
      error: "failed_to_write_through_action_center",
    })
    expect(mockedRunActionCenterSync).toHaveBeenCalledTimes(1)
  })

  it("does not sync action center for non-visit_completed event types", async () => {
    hoisted.runActionCenterSyncFromRuntime.mockClear()
    const supabase = mockSupabaseInsert({
      study_id: "S-1",
      subject_id: "SUB-001",
      visit_name: "Visit 1",
      event_type: "startup_completed",
      event_date: "2026-04-04T10:00:00.000Z",
    })

    const out = await ingestEvent({
      supabase,
      event: {
        studyId: "S-1",
        subjectId: "SUB-001",
        visitName: "Visit 1",
        eventType: "startup_completed",
        eventDate: "2026-04-04T10:00:00.000Z",
      },
      expectedBillables: expectedForVisit1,
    })

    expect(mockedRunActionCenterSync).not.toHaveBeenCalled()
    expect(out.actionCenterSync).toBeUndefined()
  })

  }) // STEP 6 describe

  it("throws when insert fails", async () => {
    hoisted.runActionCenterSyncFromRuntime.mockClear()
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: null,
              error: { message: "rls" },
            })),
          })),
        })),
      })),
    }

    await expect(
      ingestEvent({
        supabase,
        event: {
          studyId: "S-1",
          subjectId: "SUB-001",
          visitName: "Visit 1",
          eventType: "visit_completed",
          eventDate: "2026-04-04T10:00:00.000Z",
        },
        expectedBillables: expectedForVisit1,
      }),
    ).rejects.toThrow("Failed to insert event_log")
    expect(mockedRunActionCenterSync).not.toHaveBeenCalled()
  })
})
