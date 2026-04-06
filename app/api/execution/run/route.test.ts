import { describe, expect, it, vi } from "vitest"

import type { ExecutionState } from "@/lib/execution/run-operational-execution"

vi.mock("@/lib/execution/service-supabase", () => ({
  createExecutionSupabaseClient: () => ({ from: () => ({}) }),
  executionSupabaseErrorResponse: () => Response.json({ ok: false, error: "supabase_env", data: null }, { status: 500 }),
}))

const baseState: ExecutionState = {
  ok: true,
  studyKey: "STUDY-1",
  error: null,
  headline: { totalEvents: 0, totalExpectedBillables: 0, totalBillableInstances: 0 },
  totals: { expectedRevenue: 0, actualBillableAmount: 0, revenueGap: 0 },
  comparisonSummary: { matchedLineCount: 0, missingLineCount: 0, totalLineCount: 0 },
  lines: [],
  matched: [],
  missing: [],
  leakage: { missingRevenue: 0, missingLineCount: 0 },
  revenueLeakage: { data: [], summary: { totalItems: 0, totalValue: 0 }, warnings: [] },
  recent: { eventLog: [], expectedBillables: [], billableInstances: [] },
  visitByLine: {},
  actionCenterSync: { attempted: false, upserted: 0, error: null },
}

vi.mock("@/lib/execution/run-operational-execution", () => ({
  runOperationalExecution: async () => baseState,
}))

import { GET, POST } from "./route"

async function readJson(res: Response) {
  const text = await res.text()
  return JSON.parse(text) as unknown
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x)
}

function keysSorted(x: Record<string, unknown>): string[] {
  return Object.keys(x).sort()
}

describe("/api/execution/run contract", () => {
  it("GET and POST return stable success shape (ok,data,error)", async () => {
    const getRes = await GET(new Request("http://localhost/api/execution/run?study_key=STUDY-1"))
    const postRes = await POST(
      new Request("http://localhost/api/execution/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ study_key: "STUDY-1" }),
      }),
    )

    const g0 = await readJson(getRes)
    const p0 = await readJson(postRes)
    expect(isRecord(g0)).toBe(true)
    expect(isRecord(p0)).toBe(true)
    const g = g0 as Record<string, unknown>
    const p = p0 as Record<string, unknown>

    expect(keysSorted(g)).toEqual(["data", "error", "ok"])
    expect(keysSorted(p)).toEqual(["data", "error", "ok"])
    expect(g.ok).toBe(true)
    expect(p.ok).toBe(true)
    expect(g.error).toBe(null)
    expect(p.error).toBe(null)
  })

  it("bad input returns ok=false with data=null", async () => {
    const getRes = await GET(new Request("http://localhost/api/execution/run"))
    const postRes = await POST(
      new Request("http://localhost/api/execution/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    )

    const g0 = await readJson(getRes)
    const p0 = await readJson(postRes)
    expect(isRecord(g0)).toBe(true)
    expect(isRecord(p0)).toBe(true)
    const g = g0 as Record<string, unknown>
    const p = p0 as Record<string, unknown>

    expect(g.ok).toBe(false)
    expect(p.ok).toBe(false)
    expect(g.data).toBe(null)
    expect(p.data).toBe(null)
  })
})

