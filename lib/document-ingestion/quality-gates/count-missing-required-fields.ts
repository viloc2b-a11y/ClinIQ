export function countMissingRequiredFields(params: {
  records: Array<{
    recordType: string
    fields: Record<string, unknown>
  }>
}): {
  totalChecked: number
  missingCount: number
} {
  let totalChecked = 0
  let missingCount = 0

  for (const record of params.records) {
    if (record.recordType === "soa_activity") {
      totalChecked += 3

      const visitName = getFieldValue(record.fields, "visitName")
      const activityDescription = getFieldValue(record.fields, "activityDescription")
      const unitPrice = getFieldValue(record.fields, "unitPrice")

      if (!visitName) missingCount += 1
      if (!activityDescription) missingCount += 1
      if (!unitPrice) missingCount += 1
    }

    if (record.recordType === "budget_line") {
      totalChecked += 2

      const category = getFieldValue(record.fields, "category")
      const unitPrice = getFieldValue(record.fields, "unitPrice")

      if (!category) missingCount += 1
      if (!unitPrice) missingCount += 1
    }

    if (record.recordType === "contract_clause") {
      totalChecked += 2

      const clauseType = getFieldValue(record.fields, "clauseType")
      const clauseText = getFieldValue(record.fields, "clauseText")

      if (!clauseType) missingCount += 1
      if (!clauseText) missingCount += 1
    }
  }

  return {
    totalChecked,
    missingCount,
  }
}

function getFieldValue(fields: Record<string, unknown>, key: string): unknown {
  const value = fields[key]

  if (
    value &&
    typeof value === "object" &&
    "value" in (value as Record<string, unknown>)
  ) {
    return (value as { value?: unknown }).value
  }

  return value
}
