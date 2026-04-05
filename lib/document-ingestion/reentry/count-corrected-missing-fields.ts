export function countCorrectedMissingFields(params: {
  records: Array<{
    recordType: "soa_activity" | "budget_line" | "contract_clause" | "invoice_line" | "visit_schedule"
    fields: Record<string, unknown>
  }>
}) {
  let totalChecked = 0
  let missingCount = 0

  for (const record of params.records) {
    if (record.recordType === "soa_activity") {
      totalChecked += 3
      if (!getValue(record.fields.visitName)) missingCount += 1
      if (!getValue(record.fields.activityDescription)) missingCount += 1
      if (!getValue(record.fields.unitPrice)) missingCount += 1
    }

    if (record.recordType === "budget_line") {
      totalChecked += 2
      if (!getValue(record.fields.category)) missingCount += 1
      if (!getValue(record.fields.unitPrice)) missingCount += 1
    }

    if (record.recordType === "contract_clause") {
      totalChecked += 2
      if (!getValue(record.fields.clauseType)) missingCount += 1
      if (!getValue(record.fields.clauseText)) missingCount += 1
    }
  }

  return {
    totalChecked,
    missingCount,
  }
}

function getValue(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    "value" in (value as Record<string, unknown>)
  ) {
    return (value as { value?: unknown }).value
  }

  return value
}
