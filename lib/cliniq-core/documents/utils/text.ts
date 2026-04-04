const NBSP = /\u00a0/g

/**
 * Split on `\n` after normalizing `\r\n` / `\r` to `\n`.
 */
export function splitLines(rawText: string): string[] {
  const s = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  if (s.length === 0) return []
  return s.split("\n")
}

/** Collapse internal horizontal whitespace; trim ends (single line). */
export function normalizeWhitespace(line: string): string {
  return line
    .replace(NBSP, " ")
    .replace(/[ \t]+/g, " ")
    .trim()
}

/** Lowercase for keyword checks; leaves non-ASCII as-is per String#toLowerCase. */
export function lowerCaseSafe(s: string): string {
  return s.toLowerCase()
}
