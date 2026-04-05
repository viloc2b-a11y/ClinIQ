/**
 * STEP 10 — Data contract for /action-center UI (no React Testing Library in repo).
 * Same payload the page receives from GET /api/action-center via getActionCenter().
 */

import { describe, expect, it, vi } from "vitest"

import { buildActionCenter, getActionCenter } from "@/lib/cliniq-core/action-center"
import type { LeakageTraceResult } from "@/lib/cliniq-core/post-award-ledger/leakage-types"
import * as buildLeakageTraceModule from "@/lib/cliniq-core/post-award-ledger/build-leakage-trace"
import * as buildActionCenterModule from "@/lib/cliniq-core/action-center/build-action-center"

describe("Action Center UI contract (STEP 10)", () => {
  it("mock service matches /api/action-center success payload: summary + 3 items, MRI excluded", () => {
    const r = getActionCenter()
    expect(r.ok).toBe(true)
    if (!r.ok) return

    expect(r.data.summary.totalOpen).toBe(3)
    expect(r.data.summary.totalHighPriority).toBe(1)
    expect(r.data.summary.totalMissingAmount).toBe(180)
    expect(r.data.summary.byOwnerRole.billing).toBe(2)
    expect(r.data.summary.byOwnerRole.site_manager).toBe(1)
    expect(r.data.summary.byActionType.prepare_invoice).toBe(2)
    expect(r.data.summary.byActionType.resolve_claim_issue).toBe(1)

    expect(r.data.items).toHaveLength(3)
    expect(r.data.items.some((i) => i.lineCode === "MRI")).toBe(false)

    const lineCodes = r.data.items.map((i) => i.lineCode).sort()
    expect(lineCodes).toEqual(["CBC", "ECG", "LABS"])

    for (const item of r.data.items) {
      expect(item.title.length).toBeGreaterThan(0)
      expect(item.description.length).toBeGreaterThan(0)
      expect(item.status).toBe("open")
    }
  })

  it("empty leakage trace → empty queue and zero summary counts", () => {
    const emptyTrace: LeakageTraceResult = {
      items: [],
      summary: {
        totalExpectedAmount: 0,
        totalInvoicedAmount: 0,
        totalMissingAmount: 0,
        itemCount: 0,
        missingCount: 0,
        partialCount: 0,
        blockedCount: 0,
      },
    }
    const ac = buildActionCenter({ leakageTrace: emptyTrace })
    expect(ac.items).toHaveLength(0)
    expect(ac.summary.totalOpen).toBe(0)
    expect(ac.summary.totalHighPriority).toBe(0)
    expect(ac.summary.totalMissingAmount).toBe(0)
    expect(Object.keys(ac.summary.byOwnerRole)).toHaveLength(0)
    expect(Object.keys(ac.summary.byActionType)).toHaveLength(0)
  })

  it("error service shape when pipeline throws", () => {
    vi.spyOn(buildLeakageTraceModule, "buildLeakageTrace").mockImplementation(() => {
      throw new Error("simulated")
    })
    const r = getActionCenter()
    expect(r).toEqual({ ok: false, error: "failed_to_build_action_center" })
    vi.restoreAllMocks()
  })

  it("error shape when buildActionCenter throws after trace", () => {
    vi.spyOn(buildActionCenterModule, "buildActionCenter").mockImplementation(() => {
      throw new Error("simulated")
    })
    const r = getActionCenter()
    expect(r).toEqual({ ok: false, error: "failed_to_build_action_center" })
    vi.restoreAllMocks()
  })
})
