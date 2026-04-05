import type { SoaBridgeRow } from "./types"
import { getCanonicalValue } from "./shared/get-canonical-value"
import { parseNumberLike } from "./shared/parse-number-like"

export function buildSoaBridgePayload(params: {
  records: Array<{
    recordType: string
    fields: Record<string, unknown>
    trace?: Record<string, unknown>
  }>
}) {
  const rows: SoaBridgeRow[] = []

  for (const record of params.records) {
    if (record.recordType !== "soa_activity") continue

    const visitName = getCanonicalValue(record.fields.visitName)
    const activityDescription = getCanonicalValue(record.fields.activityDescription)
    const unitPrice = parseNumberLike(getCanonicalValue(record.fields.unitPrice))

    if (
      typeof visitName !== "string" ||
      !visitName.trim() ||
      typeof activityDescription !== "string" ||
      !activityDescription.trim()
    ) {
      continue
    }

    rows.push({
      visitName: visitName.trim(),
      activityDescription: activityDescription.trim(),
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
