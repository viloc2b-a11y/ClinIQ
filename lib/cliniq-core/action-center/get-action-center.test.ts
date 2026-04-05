import { afterEach, describe, expect, it, vi } from "vitest"

import * as buildLeakageTraceModule from "../post-award-ledger/build-leakage-trace"
import * as buildActionCenterModule from "./build-action-center"
import { getActionCenter } from "./get-action-center"

describe("getActionCenter", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns ok true; result.data.items exists", () => {
    const result = getActionCenter()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.items).toBeDefined()
      expect(Array.isArray(result.data.items)).toBe(true)
    }
  })

  it("calling twice returns deep-equal result", () => {
    const a = getActionCenter()
    const b = getActionCenter()
    expect(a).toEqual(b)
  })

  it("summary matches item counts and missing total", () => {
    const result = getActionCenter()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const { items, summary } = result.data
    expect(summary.totalOpen).toBe(items.length)
    const sumMissing = items.reduce((s, i) => s + i.missingAmount, 0)
    expect(summary.totalMissingAmount).toBe(sumMissing)
  })

  it("fully invoiced fixture row (MRI) does not appear in items", () => {
    const result = getActionCenter()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.items.some((i) => i.lineCode === "MRI")).toBe(false)
  })

  it("snapshot: stable mock API payload (JSON-serializable)", () => {
    const result = getActionCenter()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const normalized = JSON.parse(JSON.stringify(result)) as unknown
    expect(normalized).toMatchSnapshot()
  })

  it("error path when buildLeakageTrace throws", () => {
    vi.spyOn(buildLeakageTraceModule, "buildLeakageTrace").mockImplementation(() => {
      throw new Error("simulated_trace_failure")
    })
    expect(getActionCenter()).toEqual({
      ok: false,
      error: "failed_to_build_action_center",
    })
  })

  it("error path when buildActionCenter throws", () => {
    vi.spyOn(buildActionCenterModule, "buildActionCenter").mockImplementation(() => {
      throw new Error("simulated_action_center_failure")
    })
    expect(getActionCenter()).toEqual({
      ok: false,
      error: "failed_to_build_action_center",
    })
  })
})
