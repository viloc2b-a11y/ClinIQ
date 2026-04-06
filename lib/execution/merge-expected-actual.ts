export type ExpectedAggRow = {
  line_code: string
  expected_quantity: number
  expected_revenue: number
}

export type ActualAggRow = {
  fee_code: string
  actual_quantity: number
  actual_amount: number
}

export type ExpectedVsActualLine = {
  line_code: string
  expected_quantity: number
  expected_revenue: number
  actual_quantity: number
  actual_amount: number
  quantity_gap: number
  revenue_gap: number
}

/**
 * Join expected (SoA) rows to billable_instances aggregates on `line_code` ↔ `fee_code`.
 */
export function mergeExpectedAndActual(
  expected: ExpectedAggRow[],
  actual: ActualAggRow[],
): ExpectedVsActualLine[] {
  const byLine = new Map<string, ExpectedVsActualLine>()

  for (const e of expected) {
    const code = e.line_code
    const cur = byLine.get(code) ?? {
      line_code: code,
      expected_quantity: 0,
      expected_revenue: 0,
      actual_quantity: 0,
      actual_amount: 0,
      quantity_gap: 0,
      revenue_gap: 0,
    }
    cur.expected_quantity += e.expected_quantity
    cur.expected_revenue += e.expected_revenue
    byLine.set(code, cur)
  }

  for (const a of actual) {
    const code = a.fee_code
    const cur = byLine.get(code) ?? {
      line_code: code,
      expected_quantity: 0,
      expected_revenue: 0,
      actual_quantity: 0,
      actual_amount: 0,
      quantity_gap: 0,
      revenue_gap: 0,
    }
    cur.actual_quantity += a.actual_quantity
    cur.actual_amount += a.actual_amount
    byLine.set(code, cur)
  }

  const rows = [...byLine.values()].map((r) => ({
    ...r,
    quantity_gap: r.expected_quantity - r.actual_quantity,
    revenue_gap: r.expected_revenue - r.actual_amount,
  }))

  rows.sort((a, b) => a.line_code.localeCompare(b.line_code))
  return rows
}
