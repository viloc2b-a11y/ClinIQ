import { runExcelHardening } from "../run-excel-hardening"
import { toCanonicalRecords } from "../to-canonical-records"
import type { ExtractedRow } from "../extract-row-fields"

export type ExcelAuditTestCase = {
  id: string
  workbook: Record<string, unknown>
  expected: {
    minRows: number
    requiredFields: string[]
    /** When set, selected sheet name must include this substring (case-insensitive). */
    sheetHint?: string
  }
}

function fieldPresent(fields: Record<string, unknown>, name: string): boolean {
  const v = fields[name]
  if (v === null || v === undefined) return false
  if (typeof v === "string") return v.trim().length > 0
  if (typeof v === "number") return Number.isFinite(v)
  return true
}

function fieldCompletionForRecords(
  records: Array<{ fields: Record<string, unknown> }>,
  requiredFields: string[],
): number {
  if (records.length === 0 || requiredFields.length === 0) return 0
  let hits = 0
  const slots = records.length * requiredFields.length
  for (const r of records) {
    for (const f of requiredFields) {
      if (fieldPresent(r.fields, f)) hits += 1
    }
  }
  return Math.round((hits / slots) * 1000) / 1000
}

function statusForRates(extractionRate: number, fieldCompletionRate: number): "pass" | "partial" | "fail" {
  if (extractionRate >= 0.85 && fieldCompletionRate >= 0.8) return "pass"
  if (extractionRate >= 0.7 && fieldCompletionRate >= 0.7) return "partial"
  return "fail"
}

export function runExcelAudit(params: { testCases: ExcelAuditTestCase[] }) {
  const results: Array<{
    testId: string
    extractionRate: number
    avgConfidence: number
    fieldCompletionRate: number
    status: "pass" | "partial" | "fail"
  }> = []

  const warnings: Array<{ code: string; message: string; severity: "info" | "warning" | "error" }> = []

  for (const tc of params.testCases) {
    const hardened = runExcelHardening({ workbook: tc.workbook })
    const parsed = hardened.data.parsedRows as ExtractedRow[]
    const canonical = toCanonicalRecords({
      selectedSheet: hardened.data.selectedSheet,
      parsedRows: parsed,
      fileName: `${tc.id}.xlsx`,
    })

    const sheetHint = tc.expected.sheetHint
    const sheetDetectedCorrectly =
      sheetHint === undefined
        ? hardened.data.selectedSheet.length > 0
        : hardened.data.selectedSheet.toLowerCase().includes(sheetHint.toLowerCase())

    if (sheetHint !== undefined && !sheetDetectedCorrectly) {
      warnings.push({
        code: "audit_sheet_mismatch",
        message: `Test ${tc.id}: expected sheet hint "${sheetHint}" not found in selected "${hardened.data.selectedSheet}"`,
        severity: "warning",
      })
    }

    const usableRows = hardened.summary.usableRows
    const extractionRate = hardened.summary.extractionRate
    const avgConfidence = hardened.summary.avgConfidence
    const fieldCompletionRate = fieldCompletionForRecords(
      canonical.data.records,
      tc.expected.requiredFields,
    )

    const missingCriticalFields: string[] = []
    for (const f of tc.expected.requiredFields) {
      const any = canonical.data.records.some((r) => fieldPresent(r.fields, f))
      if (!any) missingCriticalFields.push(f)
    }

    const status = statusForRates(extractionRate, fieldCompletionRate)

    if (usableRows < tc.expected.minRows) {
      warnings.push({
        code: "audit_below_min_rows",
        message: `Test ${tc.id}: usableRows ${usableRows} < expected minRows ${tc.expected.minRows}`,
        severity: "error",
      })
    }

    if (missingCriticalFields.length > 0) {
      warnings.push({
        code: "audit_missing_critical_fields",
        message: `Test ${tc.id}: missing required fields across records: ${missingCriticalFields.join(", ")}`,
        severity: "error",
      })
    }

    results.push({
      testId: tc.id,
      extractionRate,
      avgConfidence,
      fieldCompletionRate,
      status,
    })
  }

  const n = results.length || 1
  const avgExtractionRate =
    Math.round((results.reduce((a, r) => a + r.extractionRate, 0) / n) * 1000) / 1000
  const avgConfidence =
    Math.round((results.reduce((a, r) => a + r.avgConfidence, 0) / n) * 1000) / 1000
  const passRate =
    Math.round((results.filter((r) => r.status === "pass").length / n) * 1000) / 1000

  return {
    data: {
      results: results.map((r) => ({
        testId: r.testId,
        extractionRate: r.extractionRate,
        avgConfidence: r.avgConfidence,
        fieldCompletionRate: r.fieldCompletionRate,
        status: r.status,
      })),
    },
    summary: {
      avgExtractionRate,
      avgConfidence,
      passRate,
    },
    warnings,
  }
}
