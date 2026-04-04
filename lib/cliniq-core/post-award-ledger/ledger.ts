import type { BillableInstance, ExpectedBillable, LedgerEntry, LedgerEntryStatus } from "./types"

type AggExpected = {
  lineCode: string
  label: string
  category: string
  expectedRevenue: number
}

function aggregateExpected(rows: ExpectedBillable[]): Map<string, AggExpected> {
  const m = new Map<string, AggExpected>()
  for (const r of rows) {
    const cur = m.get(r.lineCode)
    if (cur) {
      cur.expectedRevenue += r.expectedRevenue
    } else {
      m.set(r.lineCode, {
        lineCode: r.lineCode,
        label: r.label,
        category: r.category,
        expectedRevenue: r.expectedRevenue,
      })
    }
  }
  return m
}

function aggregateActual(
  instances: BillableInstance[],
): Map<string, { actual: number; count: number; label: string; category: string }> {
  const m = new Map<string, { actual: number; count: number; label: string; category: string }>()
  for (const b of instances) {
    const cur = m.get(b.lineCode)
    if (cur) {
      cur.actual += b.totalAmount
      cur.count += 1
    } else {
      m.set(b.lineCode, {
        actual: b.totalAmount,
        count: 1,
        label: b.label,
        category: b.category,
      })
    }
  }
  return m
}

function entryStatus(expected: number, actual: number): LedgerEntryStatus {
  if (actual <= 0 && expected > 0) return "none"
  if (actual < expected) return "partial"
  if (actual === expected) return "full"
  return "overage"
}

/**
 * Merge modeled expectations with realized billables (by lineCode).
 */
export function buildLedger(
  expectedBillables: ExpectedBillable[],
  billableInstances: BillableInstance[],
): LedgerEntry[] {
  const expByCode = aggregateExpected(expectedBillables)
  const actByCode = aggregateActual(billableInstances)

  const codes = new Set<string>([...expByCode.keys(), ...actByCode.keys()])
  const entries: LedgerEntry[] = []

  for (const lineCode of codes) {
    const exp = expByCode.get(lineCode)
    const act = actByCode.get(lineCode)
    const expectedRevenue = exp?.expectedRevenue ?? 0
    const actualRevenue = act?.actual ?? 0
    const matchedBillableCount = act?.count ?? 0

    if (expectedRevenue === 0 && actualRevenue === 0) continue

    entries.push({
      lineCode,
      label: exp?.label ?? act?.label ?? lineCode,
      category: exp?.category ?? act?.category ?? "—",
      expectedRevenue,
      actualRevenue,
      variance: actualRevenue - expectedRevenue,
      matchedBillableCount,
      status: entryStatus(expectedRevenue, actualRevenue),
    })
  }

  entries.sort((a, b) => a.lineCode.localeCompare(b.lineCode))
  return entries
}
