import type { HumanFieldCorrection, HumanResolutionPayload } from "./types"

export function buildHumanResolutionPayload(params: {
  reviewItem: {
    reviewId: string
    fileName: string | null
    sourceType: "excel" | "pdf" | "word" | "unknown"
    fieldIssues: Array<{
      fieldName: string
    }>
  }
  adapted: {
    data: {
      records: Array<{
        recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
        fields: Record<string, unknown>
      }>
    }
  }
}): HumanResolutionPayload {
  const corrections = params.adapted.data.records.flatMap((record, recordIndex) =>
    params.reviewItem.fieldIssues
      .filter((issue) => issue.fieldName !== "*")
      .filter((issue) => issue.fieldName in record.fields)
      .map(
        (issue): HumanFieldCorrection => ({
          recordIndex,
          recordType: record.recordType,
          fieldName: issue.fieldName,
          originalValue: getFieldValue(record.fields[issue.fieldName]),
          correctedValue: null,
          decision: "skip",
        }),
      ),
  )

  return {
    reviewId: params.reviewItem.reviewId,
    fileName: params.reviewItem.fileName,
    sourceType: params.reviewItem.sourceType,
    corrections: dedupeCorrections(corrections),
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

function dedupeCorrections<
  T extends { recordIndex: number; fieldName: string; recordType: string },
>(items: T[]): T[] {
  const seen = new Set<string>()
  const output: T[] = []

  for (const item of items) {
    const key = `${item.recordIndex}|${item.recordType}|${item.fieldName}`
    if (seen.has(key)) continue
    seen.add(key)
    output.push(item)
  }

  return output
}
