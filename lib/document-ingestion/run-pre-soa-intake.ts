/**
 * Document Engine v1 — Excel-first SoA intake: parse → canonical handoff → bridge → pre-SoA rows.
 * No ClinIQ core, billables, or persistence.
 */

import { toPreSoaRows } from "./adapters/to-pre-soa-rows"
import { bridgeDocumentRecords } from "./bridge-document-records"
import { parseDocument, type ParseDocumentInput } from "./parse-document"
import { toCanonicalHandoff } from "./to-canonical-handoff"
import type { ParsedDocument, ParsedDocumentRecord } from "./types"

export type RunPreSoaIntakeInput = {
  documentId?: string
  fileName: string
  mimeType?: string
  rawText?: string
  rows?: Record<string, unknown>[]
  tables?: Record<string, unknown>[][]
}

export type RunPreSoaIntakeResult = {
  parsedDocument: ParsedDocument
  handoff: {
    records: ParsedDocumentRecord[]
    warnings: string[]
    summary: {
      totalRecords: number
      byType: Record<string, number>
      hasLowConfidence: boolean
      hasWarnings: boolean
    }
  }
  bridge: ReturnType<typeof bridgeDocumentRecords>
  preSoa: ReturnType<typeof toPreSoaRows>
}

export async function runPreSoaIntake(input: RunPreSoaIntakeInput): Promise<RunPreSoaIntakeResult> {
  const { documentId, fileName, mimeType, rawText, rows, tables } = input
  const parseInput: ParseDocumentInput = { fileName, mimeType, rawText, rows, tables }
  const parsedDocument = await parseDocument(parseInput)
  const handoff = toCanonicalHandoff(parsedDocument)
  const bridge = bridgeDocumentRecords({ documentId, parsedDocument })
  const preSoa = toPreSoaRows({ documentId, soaCandidates: bridge.soaCandidates })
  return { parsedDocument, handoff, bridge, preSoa }
}
