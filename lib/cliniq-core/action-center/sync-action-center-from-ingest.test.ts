import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ExpectedBillable } from "../post-award-ledger/types"

const runActionCenterSyncFromRuntime = vi.hoisted(() => vi.fn())

vi.mock("./run-action-center-sync-from-runtime", () => ({
  runActionCenterSyncFromRuntime: runActionCenterSyncFromRuntime,
}))

import {
  isVisitCompletedEventType,
  syncActionCenterFromIngestPipeline,
} from "./sync-action-center-from-ingest"

const eb: ExpectedBillable[] = [
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
    unitPrice: 100,
    expectedRevenue: 100,
  },
]

describe("isVisitCompletedEventType", () => {
  it("matches visit_completed case-insensitively with trim", () => {
    expect(isVisitCompletedEventType("visit_completed")).toBe(true)
    expect(isVisitCompletedEventType("  VISIT_COMPLETED  ")).toBe(true)
    expect(isVisitCompletedEventType("startup_completed")).toBe(false)
  })
})

describe("syncActionCenterFromIngestPipeline", () => {
  beforeEach(() => {
    runActionCenterSyncFromRuntime.mockReset()
    runActionCenterSyncFromRuntime.mockResolvedValue({
      items: [],
      insertedCount: 1,
      updatedCount: 0,
      unchangedCount: 0,
    })
  })

  it("returns undefined and does not call runActionCenterSyncFromRuntime for non-visit events", async () => {
    const out = await syncActionCenterFromIngestPipeline({
      eventType: "startup_completed",
      expectedBillables: eb,
      ledgerRows: [],
      claimItems: [],
      invoicePackages: [],
    })
    expect(out).toBeUndefined()
    expect(runActionCenterSyncFromRuntime).not.toHaveBeenCalled()
  })

  it("calls runActionCenterSyncFromRuntime with ingest financial outputs for visit_completed", async () => {
    const ledgerRows = [{ studyId: "S-1", lineCode: "V1" }] as never
    const claimItems = [{ id: "c1" }] as never
    const invoicePackages = [{ schemaVersion: "1.0", lines: [] }] as never

    const out = await syncActionCenterFromIngestPipeline({
      eventType: "visit_completed",
      expectedBillables: eb,
      ledgerRows,
      claimItems,
      invoicePackages,
    })

    expect(runActionCenterSyncFromRuntime).toHaveBeenCalledWith({
      expectedBillables: eb,
      ledgerRows,
      claimItems,
      invoicePackages,
    })
    expect(out).toEqual({ ok: true, insertedCount: 1, updatedCount: 0, unchangedCount: 0 })
  })

  it("passes only expectedBillables when optional artifacts are omitted", async () => {
    await syncActionCenterFromIngestPipeline({
      eventType: "visit_completed",
      expectedBillables: eb,
    })
    expect(runActionCenterSyncFromRuntime).toHaveBeenCalledWith({
      expectedBillables: eb,
      ledgerRows: undefined,
      claimItems: undefined,
      invoicePackages: undefined,
    })
  })

  it("returns ok false when runActionCenterSyncFromRuntime throws", async () => {
    runActionCenterSyncFromRuntime.mockRejectedValue(new Error("failed_to_write_through_action_center"))
    const out = await syncActionCenterFromIngestPipeline({
      eventType: "visit_completed",
      expectedBillables: eb,
      ledgerRows: [],
      claimItems: [],
      invoicePackages: [],
    })
    expect(out).toEqual({ ok: false, error: "failed_to_write_through_action_center" })
  })
})
