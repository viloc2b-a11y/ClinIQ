import type { HardenedParseResult, HardenedRecord } from "../types"
import { buildIntakeWarning } from "../build-intake-warning"
import { summarizeHardenedParse } from "../summarize-hardened-parse"
import { extractPdfTextBlocks } from "./extract-pdf-text-blocks"

export function parsePdfStructuredText(params: {
  pages: Array<{ text?: string | null }>
  fileName?: string
}): HardenedParseResult {
  const blocks = extractPdfTextBlocks({ pages: params.pages })
  const warnings: HardenedParseResult["warnings"] = []
  const records: HardenedRecord[] = []

  const rawText = blocks.map((b) => b.text).join("\n\n").trim()

  if (!rawText) {
    warnings.push(
      buildIntakeWarning({
        code: "empty_document",
        message: "PDF text extraction returned empty content",
        severity: "error",
      }),
    )
  }

  for (const block of blocks) {
    if (!block.text) continue

    if (block.text.length < 50) {
      warnings.push(
        buildIntakeWarning({
          code: "low_text_density",
          message: `Low text density on page ${block.pageNumber}`,
          location: { pageNumber: block.pageNumber },
        }),
      )
    }

    const lines = block.text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)

    for (const line of lines) {
      if (
        /visit|procedure|activity|fee|amount|schedule/i.test(line)
      ) {
        records.push({
          recordType: "soa_activity",
          fields: {
            rawLine: {
              value: line,
              confidence: "medium",
              trace: {
                sourceType: "pdf",
                fileName: params.fileName,
                pageNumber: block.pageNumber,
                rawTextSnippet: line,
              },
            },
          },
          trace: {
            sourceType: "pdf",
            fileName: params.fileName,
            pageNumber: block.pageNumber,
            rawTextSnippet: line,
          },
        })
      }
    }
  }

  if (records.length === 0 && rawText) {
    warnings.push(
      buildIntakeWarning({
        code: "partial_parse",
        message: "PDF text was extracted but no structured records were detected",
      }),
    )
  }

  return summarizeHardenedParse({
    sourceType: "pdf",
    records,
    rawText,
    warnings,
  })
}
