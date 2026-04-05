import type { ExtractedRow } from "./extract-row-fields"

export type ExcelCanonicalRecord = {
  recordType: "soa_activity" | "budget_line" | "visit_schedule"
  fields: Record<string, unknown>
  trace?: Record<string, unknown>
}

export function toCanonicalRecords(params: {
  selectedSheet: string
  parsedRows: ExtractedRow[]
  fileName?: string | null
}) {
  const records: ExcelCanonicalRecord[] = []
  const warnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error" }> =
    []

  for (const row of params.parsedRows) {
    const ex = row.extracted
    const visit = ex.visitName?.value
    const activity = ex.activity?.value
    const unitPrice = ex.unitPrice?.value
    const quantity = ex.quantity?.value
    const lineCode = ex.lineCode?.value

    const trace: Record<string, unknown> = {
      sourceType: "excel",
      fileName: params.fileName ?? null,
      sheetName: params.selectedSheet,
      rowIndex: row.rowIndex,
      overallConfidence: row.overallConfidence,
      fieldConfidence: Object.fromEntries(
        Object.entries(ex).map(([k, v]) => [k, { confidence: v.confidence, sourceColumn: v.sourceColumn }]),
      ),
    }

    const vStr = typeof visit === "string" ? visit.trim() : ""
    const aStr = typeof activity === "string" ? activity.trim() : ""

    if (vStr && aStr) {
      records.push({
        recordType: "soa_activity",
        fields: {
          visitName: vStr,
          activityDescription: aStr,
          unitPrice: unitPrice ?? null,
          ...(quantity !== null && quantity !== undefined && quantity !== "" ? { quantity } : {}),
        },
        trace,
      })
      continue
    }

    const catStr = typeof lineCode === "string" ? lineCode.trim() : ""
    if (catStr && (unitPrice !== null && unitPrice !== undefined && unitPrice !== "")) {
      records.push({
        recordType: "budget_line",
        fields: {
          category: catStr,
          visitName: vStr || null,
          unitPrice: unitPrice ?? null,
        },
        trace,
      })
      continue
    }

    if (vStr && !aStr) {
      records.push({
        recordType: "visit_schedule",
        fields: {
          visitName: vStr,
          notes:
            catStr ||
            (typeof unitPrice === "number" ? `value:${unitPrice}` : "") ||
            null,
        },
        trace,
      })
      continue
    }

    if (aStr && !vStr) {
      warnings.push({
        code: "canonical_skip_incomplete_row",
        message: `Row ${row.rowIndex}: activity without visit — not mapped to canonical record`,
        severity: "warning",
      })
    }
  }

  return {
    data: { records },
    summary: {
      totalRecords: records.length,
      soaCount: records.filter((r) => r.recordType === "soa_activity").length,
      budgetCount: records.filter((r) => r.recordType === "budget_line").length,
      visitScheduleCount: records.filter((r) => r.recordType === "visit_schedule").length,
    },
    warnings,
  }
}
