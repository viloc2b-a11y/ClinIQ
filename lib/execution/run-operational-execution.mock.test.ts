import { describe, expect, it, vi } from "vitest"

import { runOperationalExecution } from "./run-operational-execution"

type QueryResult = { data: unknown; error: null | { message: string }; count?: number | null }

type TableConfig = {
  event_log: { count: number; rows: Record<string, unknown>[] }
  expected_billables: {
    count: number
    rows: Record<string, unknown>[]
    compRows: Record<string, unknown>[]
  }
  billable_instances: {
    count: number
    rows: Record<string, unknown>[]
    compRows: Record<string, unknown>[]
  }
}

type QueryBuilder = {
  select: (sel: string, opts?: { head?: boolean; count?: "exact" }) => QueryBuilder
  eq: (col: string, value: unknown) => QueryBuilder
  order: (col: string, opts?: unknown) => QueryBuilder
  limit: (n: number) => Promise<QueryResult>
  then: (
    onFulfilled: (v: QueryResult) => unknown,
    onRejected?: (e: unknown) => unknown,
  ) => Promise<unknown>
}

function makeSupabaseClient(config: TableConfig) {
  const from = (table: keyof TableConfig) => {
    const state = {
      table,
      select: "",
      head: false,
      count: null as null | "exact",
      eq: {} as Record<string, unknown>,
      order: null as null | { col: string; opts?: unknown },
      limit: null as null | number,
    }

    const api: QueryBuilder = {
      select(sel: string, opts?: { head?: boolean; count?: "exact" }) {
        state.select = sel
        state.head = Boolean(opts?.head)
        state.count = opts?.count ?? null
        return api
      },
      eq(col: string, value: unknown) {
        state.eq[col] = value
        return api
      },
      order(col: string, opts?: unknown) {
        state.order = { col, opts }
        return api
      },
      limit(n: number) {
        state.limit = n
        return Promise.resolve(resolve())
      },
      then(onFulfilled: (v: QueryResult) => unknown, onRejected?: (e: unknown) => unknown) {
        return Promise.resolve(resolve()).then(onFulfilled, onRejected)
      },
    }

    function resolve(): QueryResult {
      const cfg = config[table]

      if (state.head && state.count === "exact") {
        return { data: null, error: null, count: cfg.count }
      }

      switch (table) {
        case "event_log":
          return { data: cfg.rows, error: null }
        case "expected_billables":
          return state.select.includes("line_code")
            ? { data: cfg.compRows, error: null }
            : { data: cfg.rows, error: null }
        case "billable_instances":
          return state.select.includes("fee_code")
            ? { data: cfg.compRows, error: null }
            : { data: cfg.rows, error: null }
      }
    }

    return api
  }

  return { from } as unknown
}

vi.mock("@/lib/cliniq-core/action-center/persistence-config", () => ({
  isSupabasePersistenceEnabled: () => true,
}))

const upsertActionItems = vi.fn(async () => {})
vi.mock("@/lib/cliniq-core/action-center/get-persistence-adapter", () => ({
  getActionCenterPersistenceAdapter: () => ({ upsertActionItems }),
}))

describe("runOperationalExecution (mocked Supabase)", () => {
  it("matched-only scenario", async () => {
    const client = makeSupabaseClient({
      event_log: { count: 1, rows: [{ id: "e1" }] },
      expected_billables: {
        count: 1,
        rows: [{ id: "x" }],
        compRows: [{ line_code: "ECG", visit_name: "V1", expected_quantity: 1, expected_revenue: 100 }],
      },
      billable_instances: {
        count: 1,
        rows: [{ id: "b1" }],
        compRows: [{ fee_code: "ECG", quantity: 1, amount: 100 }],
      },
    })

    const out = await runOperationalExecution(client, "STUDY-1")
    expect(out.ok).toBe(true)
    expect(out.leakage.missingLineCount).toBe(0)
    expect(out.comparisonSummary.matchedLineCount).toBeGreaterThan(0)
    expect(out.missing).toHaveLength(0)
  })

  it("missing-only scenario + prioritization", async () => {
    const client = makeSupabaseClient({
      event_log: { count: 0, rows: [] },
      expected_billables: {
        count: 2,
        rows: [],
        compRows: [
          { line_code: "A", visit_name: "V1", expected_quantity: 1, expected_revenue: 1200 },
          { line_code: "B", visit_name: "V1", expected_quantity: 1, expected_revenue: 100 },
        ],
      },
      billable_instances: {
        count: 0,
        rows: [],
        compRows: [],
      },
    })

    const out = await runOperationalExecution(client, "STUDY-1")
    expect(out.ok).toBe(true)
    expect(out.missing).toHaveLength(2)
    expect(out.missing[0]!.lineCode).toBe("A")
    expect(out.missing[0]!.priorityRank).toBe(1)
    expect(out.missing[0]!.severity).toBe("high")
    expect(out.missing[0]!.estimatedRevenueAtRisk).toBe(1200)
  })

  it("mixed matched + missing", async () => {
    const client = makeSupabaseClient({
      event_log: { count: 0, rows: [] },
      expected_billables: {
        count: 2,
        rows: [],
        compRows: [
          { line_code: "ECG", visit_name: "V1", expected_quantity: 1, expected_revenue: 100 },
          { line_code: "CBC", visit_name: "V1", expected_quantity: 1, expected_revenue: 200 },
        ],
      },
      billable_instances: {
        count: 1,
        rows: [],
        compRows: [{ fee_code: "ECG", quantity: 1, amount: 100 }],
      },
    })

    const out = await runOperationalExecution(client, "STUDY-1")
    expect(out.ok).toBe(true)
    expect(out.matched.some((x) => x.lineCode === "ECG")).toBe(true)
    expect(out.missing.some((x) => x.lineCode === "CBC")).toBe(true)
  })

  it("syncActionCenter false does not attempt", async () => {
    upsertActionItems.mockClear()
    const client = makeSupabaseClient({
      event_log: { count: 0, rows: [] },
      expected_billables: {
        count: 1,
        rows: [],
        compRows: [{ line_code: "CBC", visit_name: "V1", expected_quantity: 1, expected_revenue: 200 }],
      },
      billable_instances: { count: 0, rows: [], compRows: [] },
    })

    const out = await runOperationalExecution(client, "STUDY-1", { syncActionCenter: false })
    expect(out.ok).toBe(true)
    expect(out.actionCenterSync.attempted).toBe(false)
    expect(upsertActionItems).not.toHaveBeenCalled()
  })

  it("syncActionCenter true attempts and handles adapter failure", async () => {
    upsertActionItems.mockRejectedValueOnce(new Error("boom"))
    const client = makeSupabaseClient({
      event_log: { count: 0, rows: [] },
      expected_billables: {
        count: 1,
        rows: [],
        compRows: [{ line_code: "CBC", visit_name: "V1", expected_quantity: 1, expected_revenue: 200 }],
      },
      billable_instances: { count: 0, rows: [], compRows: [] },
    })

    const out = await runOperationalExecution(client, "STUDY-1", { syncActionCenter: true })
    expect(out.ok).toBe(true)
    expect(out.actionCenterSync.attempted).toBe(true)
    expect(out.actionCenterSync.error).toBe("boom")
  })
})

