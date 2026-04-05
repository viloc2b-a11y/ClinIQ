import type { BudgetBridgeRow } from "./types"
import { getCanonicalValue } from "./shared/get-canonical-value"
import { parseNumberLike } from "./shared/parse-number-like"

export function buildBudgetBridgePayload(params: {
  records: Array<{
    recordType: string
    fields: Record<string, unknown>
    trace?: Record<string, unknown>
  }>
}) {
  const rows: BudgetBridgeRow[] = []

  for (const record of params.records) {
    if (record.recordType !== "budget_line") continue

    const category = getCanonicalValue(record.fields.category)
    const visitName = getCanonicalValue(record.fields.visitName)
    const unitPrice = parseNumberLike(getCanonicalValue(record.fields.unitPrice))

    if (typeof category !== "string" || !category.trim()) continue

    rows.push({
      category: category.trim(),
      visitName:
        typeof visitName === "string" && visitName.trim()
          ? visitName.trim()
          : null,
      unitPrice,
      sourceTrace: record.trace,
    })
  }

  return {
    data: {
      rows,
    },
    summary: {
      totalRows: rows.length,
    },
    warnings: [] as Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>,
  }
}
