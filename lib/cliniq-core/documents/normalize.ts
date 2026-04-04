import { normalizeWhitespace, splitLines } from "./utils/text"

export type NormalizeTextResult = {
  normalizedText: string
  parseWarnings: string[]
}

const SHORT_THRESHOLD = 12

/**
 * Preserve line order; trim/clean spacing per line; join with `\n`.
 */
export function normalizeText(rawText: string): NormalizeTextResult {
  const parseWarnings: string[] = []
  const lines = splitLines(rawText)
  const normalizedLines = lines.map(normalizeWhitespace)
  const normalizedText = normalizedLines.join("\n").trimEnd()

  if (normalizedText.length === 0) {
    parseWarnings.push("empty_input")
    return { normalizedText: "", parseWarnings }
  }

  if (normalizedText.length < SHORT_THRESHOLD) {
    parseWarnings.push("very_short_text")
  }

  if (normalizedLines.length === 1 && rawText.length > 240 && !rawText.includes("\n")) {
    parseWarnings.push("single_line_long_text")
  }

  return { normalizedText, parseWarnings }
}
