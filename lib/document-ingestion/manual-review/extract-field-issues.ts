import type { ManualReviewFieldIssue } from "./types"

export function extractFieldIssues(params: {
  adapted: {
    summary: {
      fallbackUsed: boolean
    }
    data: {
      records: Array<{
        recordType: string
        fields: Record<string, unknown>
        trace?: {
          sourceType?: "excel" | "pdf" | "word" | "unknown"
          fileName?: string
          sheetName?: string
          pageNumber?: number
          rowIndex?: number
          rawTextSnippet?: string
        }
      }>
    }
    warnings: Array<{
      code: string
      message: string
      severity: "info" | "warning" | "error"
    }>
  }
  qualityGate: {
    data: {
      reasons: Array<{
        code: string
        message: string
        severity: "info" | "warning" | "error"
      }>
    }
  }
}): ManualReviewFieldIssue[] {
  const issues: ManualReviewFieldIssue[] = []

  for (const record of params.adapted.data.records) {
    if (record.recordType === "soa_activity") {
      pushIfMissing(issues, record, "visitName", "Missing visitName")
      pushIfMissing(issues, record, "activityDescription", "Missing activityDescription")
      pushIfMissing(issues, record, "unitPrice", "Missing unitPrice")
    }

    if (record.recordType === "budget_line") {
      pushIfMissing(issues, record, "category", "Missing category")
      pushIfMissing(issues, record, "unitPrice", "Missing unitPrice")
    }

    if (record.recordType === "contract_clause") {
      pushIfMissing(issues, record, "clauseType", "Missing clauseType")
      pushIfMissing(issues, record, "clauseText", "Missing clauseText")
    }
  }

  if (params.adapted.summary.fallbackUsed) {
    issues.push({
      fieldName: "*",
      issueType: "adapter_fallback",
      message: "Targeted adapter was not confidently applied; generic fallback used",
    })
  }

  for (const warning of params.adapted.warnings) {
    if (warning.severity === "error") {
      issues.push({
        fieldName: "*",
        issueType: "critical_warning",
        message: warning.message,
      })
    }
  }

  for (const reason of params.qualityGate.data.reasons) {
    if (reason.code === "too_many_low_confidence_records") {
      issues.push({
        fieldName: "*",
        issueType: "low_confidence",
        message: reason.message,
      })
    }

    if (reason.code === "missing_required_fields") {
      issues.push({
        fieldName: "*",
        issueType: "ambiguous",
        message: reason.message,
      })
    }
  }

  return dedupeFieldIssues(issues)
}

function pushIfMissing(
  issues: ManualReviewFieldIssue[],
  record: {
    fields: Record<string, unknown>
    trace?: {
      sourceType?: "excel" | "pdf" | "word" | "unknown"
      fileName?: string
      sheetName?: string
      pageNumber?: number
      rowIndex?: number
      rawTextSnippet?: string
    }
  },
  fieldName: string,
  message: string,
) {
  const value = getFieldValue(record.fields[fieldName])

  if (!value) {
    issues.push({
      fieldName,
      issueType: "missing",
      message,
      trace: record.trace,
    })
  }
}

function getFieldValue(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    "value" in (value as Record<string, unknown>)
  ) {
    return (value as { value?: unknown }).value
  }

  return value
}

function dedupeFieldIssues(issues: ManualReviewFieldIssue[]) {
  const seen = new Set<string>()
  const output: ManualReviewFieldIssue[] = []

  for (const issue of issues) {
    const key = [
      issue.fieldName,
      issue.issueType,
      issue.message,
      issue.trace?.sheetName || "",
      issue.trace?.pageNumber || "",
      issue.trace?.rowIndex || "",
    ].join("|")

    if (seen.has(key)) continue
    seen.add(key)
    output.push(issue)
  }

  return output
}
