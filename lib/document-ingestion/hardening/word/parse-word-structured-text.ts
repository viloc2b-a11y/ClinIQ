import type { HardenedParseResult, HardenedRecord } from "../types"
import { buildIntakeWarning } from "../build-intake-warning"
import { summarizeHardenedParse } from "../summarize-hardened-parse"
import { extractWordSections } from "./extract-word-sections"

export function parseWordStructuredText(params: {
  paragraphs: string[]
  fileName?: string
}): HardenedParseResult {
  const sections = extractWordSections({ paragraphs: params.paragraphs })
  const warnings: HardenedParseResult["warnings"] = []
  const records: HardenedRecord[] = []

  const rawText = sections.map((s) => s.text).join("\n\n").trim()

  if (!rawText) {
    warnings.push(
      buildIntakeWarning({
        code: "empty_document",
        message: "Word extraction returned empty content",
        severity: "error",
      }),
    )
  }

  for (const section of sections) {
    if (/payment|invoice|budget|schedule|visit|procedure/i.test(section.text)) {
      records.push({
        recordType: "contract_clause",
        fields: {
          rawSection: {
            value: section.text,
            confidence: section.text.length > 120 ? "medium" : "low",
            trace: {
              sourceType: "word",
              fileName: params.fileName,
              rawTextSnippet: section.text.slice(0, 200),
            },
          },
        },
        trace: {
          sourceType: "word",
          fileName: params.fileName,
          rawTextSnippet: section.text.slice(0, 200),
        },
      })
    }
  }

  if (records.length === 0 && rawText) {
    warnings.push(
      buildIntakeWarning({
        code: "partial_parse",
        message: "Word text was extracted but no structured sections were detected",
      }),
    )
  }

  return summarizeHardenedParse({
    sourceType: "word",
    records,
    rawText,
    warnings,
  })
}
