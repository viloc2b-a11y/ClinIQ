import { normalizeText } from "./normalize"
import type { ParseFileInput, ParsedFilePayload } from "./types"
import { splitLines } from "./utils/text"

/**
 * v1: accept raw text only. Future: branch on bytes/mime and produce the same payload shape.
 */
export function parseFile(input: ParseFileInput): ParsedFilePayload {
  const { normalizedText, parseWarnings } = normalizeText(input.rawText)
  const lineCount = normalizedText.length === 0 ? 0 : splitLines(normalizedText).length

  return {
    rawText: input.rawText,
    normalizedText,
    lineCount,
    parseWarnings,
    fileName: input.fileName,
  }
}
