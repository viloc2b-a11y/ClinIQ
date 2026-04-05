import type { ContractBridgeRow } from "./types"
import { getCanonicalValue } from "./shared/get-canonical-value"

export function buildContractBridgePayload(params: {
  records: Array<{
    recordType: string
    fields: Record<string, unknown>
    trace?: Record<string, unknown>
  }>
}) {
  const rows: ContractBridgeRow[] = []

  for (const record of params.records) {
    if (record.recordType !== "contract_clause") continue

    const clauseType = getCanonicalValue(record.fields.clauseType)
    const clauseText = getCanonicalValue(record.fields.clauseText)

    if (
      typeof clauseType !== "string" ||
      !clauseType.trim() ||
      typeof clauseText !== "string" ||
      !clauseText.trim()
    ) {
      continue
    }

    rows.push({
      clauseType: clauseType.trim(),
      clauseText: clauseText.trim(),
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
