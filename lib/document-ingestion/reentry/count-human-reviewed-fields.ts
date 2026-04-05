export function countHumanReviewedFields(params: {
  records: Array<{
    fields: Record<string, unknown>
  }>
}) {
  let totalFields = 0
  let humanReviewedFields = 0

  for (const record of params.records) {
    for (const value of Object.values(record.fields)) {
      totalFields += 1

      if (
        value &&
        typeof value === "object" &&
        "humanReviewed" in (value as Record<string, unknown>) &&
        (value as { humanReviewed?: unknown }).humanReviewed === true
      ) {
        humanReviewedFields += 1
      }
    }
  }

  return {
    totalFields,
    humanReviewedFields,
  }
}
