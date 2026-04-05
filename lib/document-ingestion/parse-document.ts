/**
 * Document Engine v1 — orchestrator: classify → route → canonical ParsedDocument.
 * No format-specific parsing logic beyond delegation.
 */

import { classifyDocument } from "./classify-document"
import { cleanString } from "./normalize-records"
import { parseExcel } from "./parsers/parse-excel"
import { parsePdf } from "./parsers/parse-pdf"
import { parseWord } from "./parsers/parse-word"
import type { DocumentSourceType, ParsedDocument } from "./types"
import { PARSED_DOCUMENT_SCHEMA_VERSION } from "./types"

const ORCHESTRATOR_PARSER_ID = "cliniq-parse-document-v1"

export const INVALID_DOCUMENT_INPUT_WARNING = "Invalid document input: fileName is required."

export type ParseDocumentInput = {
  fileName?: string
  mimeType?: string
  rawText?: string
  rows?: Record<string, unknown>[]
  tables?: Record<string, unknown>[][]
  sections?: string[]
}

function hasMeaningfulRawText(raw: string | undefined): boolean {
  if (raw === undefined || raw === null) return false
  return raw.split(/\n/).some((l) => cleanString(l) !== null)
}

function hasNonEmptySections(sections: string[] | undefined): boolean {
  if (sections === undefined || sections.length === 0) return false
  return sections.some((s) => cleanString(s) !== null)
}

function hasPdfBodyContent(input: ParseDocumentInput): boolean {
  if (hasMeaningfulRawText(input.rawText)) return true
  if (input.tables === undefined || input.tables.length === 0) return false
  return input.tables.some((t) => t.length > 0)
}

function hasWordBodyContent(input: ParseDocumentInput): boolean {
  return hasMeaningfulRawText(input.rawText) || hasNonEmptySections(input.sections)
}

/** Merge classifier warnings first, then the rest; drop exact duplicates in order. */
export function mergeWarnings(first: readonly string[], second: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const w of first) {
    if (!seen.has(w)) {
      seen.add(w)
      out.push(w)
    }
  }
  for (const w of second) {
    if (!seen.has(w)) {
      seen.add(w)
      out.push(w)
    }
  }
  return out
}

function buildEmptyParsedDocument(params: {
  sourceType: DocumentSourceType
  fileName?: string
  mimeType?: string
  classificationConfidence?: number
  parserId: string
  warnings: string[]
}): ParsedDocument {
  return {
    schemaVersion: PARSED_DOCUMENT_SCHEMA_VERSION,
    sourceType: params.sourceType,
    documentRole: "unknown",
    fileName: params.fileName,
    mimeType: params.mimeType,
    classificationConfidence: params.classificationConfidence,
    parsedAt: new Date().toISOString(),
    parserId: params.parserId,
    records: [],
    warnings: params.warnings,
  }
}

function applyOrchestratorMeta(
  doc: ParsedDocument,
  mimeType: string | undefined,
  classificationConfidence: number,
): ParsedDocument {
  return {
    ...doc,
    mimeType,
    classificationConfidence,
  }
}

/**
 * Classify the document, route to the appropriate parser, return a {@link ParsedDocument}.
 */
export async function parseDocument(input: ParseDocumentInput = {}): Promise<ParsedDocument> {
  const fileNameTrimmed = input.fileName?.trim() ?? ""
  if (fileNameTrimmed === "") {
    return buildEmptyParsedDocument({
      sourceType: "unknown",
      fileName: undefined,
      parserId: ORCHESTRATOR_PARSER_ID,
      warnings: [INVALID_DOCUMENT_INPUT_WARNING],
    })
  }

  const classification = classifyDocument({
    fileName: fileNameTrimmed,
    mimeType: input.mimeType,
  })
  const classifierWarnings = classification.warnings
  const confidence = classification.confidence
  const mimeType = input.mimeType

  const { sourceType } = classification

  if (sourceType === "unknown") {
    return buildEmptyParsedDocument({
      sourceType: "unknown",
      fileName: fileNameTrimmed,
      mimeType,
      classificationConfidence: confidence,
      parserId: ORCHESTRATOR_PARSER_ID,
      warnings: mergeWarnings(classifierWarnings, ["Unsupported or unrecognized document type."]),
    })
  }

  if (sourceType === "pdf") {
    if (!hasPdfBodyContent(input)) {
      return buildEmptyParsedDocument({
        sourceType: "pdf",
        fileName: fileNameTrimmed,
        mimeType,
        classificationConfidence: confidence,
        parserId: ORCHESTRATOR_PARSER_ID,
        warnings: mergeWarnings(classifierWarnings, [
          "PDF document detected but no text or tables were provided.",
        ]),
      })
    }
    const parsed = parsePdf({
      fileName: fileNameTrimmed,
      rawText: input.rawText,
      tables: input.tables,
    })
    return applyOrchestratorMeta(
      {
        ...parsed,
        warnings: mergeWarnings(classifierWarnings, parsed.warnings),
      },
      mimeType,
      confidence,
    )
  }

  if (sourceType === "word") {
    if (!hasWordBodyContent(input)) {
      return buildEmptyParsedDocument({
        sourceType: "word",
        fileName: fileNameTrimmed,
        mimeType,
        classificationConfidence: confidence,
        parserId: ORCHESTRATOR_PARSER_ID,
        warnings: mergeWarnings(classifierWarnings, [
          "Word document detected but no text or sections were provided.",
        ]),
      })
    }
    const parsed = parseWord({
      fileName: fileNameTrimmed,
      rawText: input.rawText,
      sections: input.sections,
    })
    return applyOrchestratorMeta(
      {
        ...parsed,
        warnings: mergeWarnings(classifierWarnings, parsed.warnings),
      },
      mimeType,
      confidence,
    )
  }

  const rows = input.rows
  if (rows === undefined || rows.length === 0) {
    return buildEmptyParsedDocument({
      sourceType: "excel",
      fileName: fileNameTrimmed,
      mimeType,
      classificationConfidence: confidence,
      parserId: ORCHESTRATOR_PARSER_ID,
      warnings: mergeWarnings(classifierWarnings, [
        "Excel document detected but no rows were provided.",
      ]),
    })
  }

  const parsed = parseExcel({
    fileName: fileNameTrimmed,
    rows,
  })

  return applyOrchestratorMeta(
    {
      ...parsed,
      warnings: mergeWarnings(classifierWarnings, parsed.warnings),
    },
    mimeType,
    confidence,
  )
}
