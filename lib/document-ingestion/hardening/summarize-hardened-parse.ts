import type { HardenedParseResult, HardenedRecord } from "./types"
import { scoreRecordConfidence } from "./score-record-confidence"

export function summarizeHardenedParse(params: {
  sourceType: "excel" | "pdf" | "word" | "unknown"
  records: HardenedRecord[]
  rawText?: string
  warnings: HardenedParseResult["warnings"]
}): HardenedParseResult {
  let highConfidenceRecords = 0
  let mediumConfidenceRecords = 0
  let lowConfidenceRecords = 0

  for (const record of params.records) {
    const confidence = scoreRecordConfidence(record)
    if (confidence === "high") highConfidenceRecords += 1
    else if (confidence === "medium") mediumConfidenceRecords += 1
    else lowConfidenceRecords += 1
  }

  return {
    data: {
      records: params.records,
      rawText: params.rawText,
    },
    summary: {
      sourceType: params.sourceType,
      totalRecords: params.records.length,
      highConfidenceRecords,
      mediumConfidenceRecords,
      lowConfidenceRecords,
    },
    warnings: params.warnings,
  }
}
