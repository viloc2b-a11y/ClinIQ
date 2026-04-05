import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ExpectedBillable } from "../post-award-ledger/types"

const writeThroughActionCenter = vi.hoisted(() => vi.fn())

vi.mock("./write-through-action-center", () => ({
  writeThroughActionCenter: writeThroughActionCenter,
}))

import { runActionCenterSyncFromRuntime } from "./run-action-center-sync-from-runtime"

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

describe("runActionCenterSyncFromRuntime", () => {
  beforeEach(() => {
    writeThroughActionCenter.mockReset()
    writeThroughActionCenter.mockResolvedValue({
      items: [],
      insertedCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
    })
  })

  it("calls writeThroughActionCenter with expected payload", async () => {
    await runActionCenterSyncFromRuntime({ expectedBillables: eb })
    expect(writeThroughActionCenter).toHaveBeenCalledTimes(1)
    expect(writeThroughActionCenter).toHaveBeenCalledWith({
      expectedBillables: eb,
      ledgerRows: undefined,
      claimItems: undefined,
      invoicePackages: undefined,
    })
  })

  it("passes optional artifacts through correctly", async () => {
    const ledgerRows = [{ studyId: "S-1", lineCode: "V1" }] as never
    const claimItems = [{ id: "c1" }] as never
    const invoicePackages = [{ schemaVersion: "1.0", lines: [] }] as never

    await runActionCenterSyncFromRuntime({
      expectedBillables: eb,
      ledgerRows,
      claimItems,
      invoicePackages,
    })

    expect(writeThroughActionCenter).toHaveBeenCalledWith({
      expectedBillables: eb,
      ledgerRows,
      claimItems,
      invoicePackages,
    })
  })

  it("returns write-through result unchanged (same reference)", async () => {
    const wtResult = {
      items: [] as never[],
      insertedCount: 2,
      updatedCount: 1,
      unchangedCount: 3,
    }
    writeThroughActionCenter.mockResolvedValue(wtResult)

    const out = await runActionCenterSyncFromRuntime({ expectedBillables: eb })

    expect(out).toBe(wtResult)
  })

  it("deterministic output for same input", async () => {
    const fixed = {
      items: [],
      insertedCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
    }
    writeThroughActionCenter.mockResolvedValue(fixed)

    const a = await runActionCenterSyncFromRuntime({ expectedBillables: eb })
    const b = await runActionCenterSyncFromRuntime({ expectedBillables: eb })

    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(writeThroughActionCenter).toHaveBeenCalledTimes(2)
  })
})
