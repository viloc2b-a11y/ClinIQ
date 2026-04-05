import type { ConfidenceLabel, HardenedRecord } from "./types"

export function scoreRecordConfidence(record: HardenedRecord): ConfidenceLabel {
  const values = Object.values(record.fields)

  if (values.length === 0) return "low"

  let score = 0

  for (const field of values) {
    if (field.value !== null && field.value !== "") score += 1
    if (field.confidence === "high") score += 2
    if (field.confidence === "medium") score += 1
    if (field.confidence === "low") score -= 1
  }

  if (score >= values.length * 2) return "high"
  if (score >= values.length) return "medium"
  return "low"
}
