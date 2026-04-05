import { cellString, isNumericCell, nonEmptyCount, sheetToRows } from "./shared/workbook-rows"

const KEYWORDS = ["schedule", "soa", "budget", "cost", "visit"] as const

const MAX_SCAN_ROWS = 80
const MAX_SCAN_COLS = 40

export type SheetCandidate = {
  sheetName: string
  score: number
  signals: {
    keywordScore: number
    densityScore: number
    headerScore: number
  }
}

function lowerIncludes(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle)
}

function scoreSheet(sheetName: string, rows: unknown[][]): SheetCandidate {
  let keywordHits = 0
  let keywordDenom = 1

  const nameLower = sheetName.toLowerCase()
  for (const kw of KEYWORDS) {
    if (lowerIncludes(nameLower, kw)) keywordHits += 3
  }
  keywordDenom += 3 * KEYWORDS.length

  let numericCells = 0
  let nonEmptyCells = 0
  let totalSampled = 0
  let headerLikeRows = 0
  let emptyCells = 0

  const scanR = Math.min(rows.length, MAX_SCAN_ROWS)
  for (let r = 0; r < scanR; r++) {
    const row = rows[r] || []
    const scanC = Math.min(row.length, MAX_SCAN_COLS)
    let textHeaders = 0
    let rowNonEmpty = 0
    for (let c = 0; c < scanC; c++) {
      totalSampled += 1
      const s = cellString(row[c])
      if (s === "") {
        emptyCells += 1
        continue
      }
      rowNonEmpty += 1
      nonEmptyCells += 1
      if (isNumericCell(row[c])) numericCells += 1
      else if (s.length > 0 && s.length < 80) {
        const sl = s.toLowerCase()
        for (const kw of KEYWORDS) {
          if (lowerIncludes(sl, kw)) keywordHits += 1
        }
        textHeaders += 1
      }
    }
    if (textHeaders >= 3 && rowNonEmpty >= 3) headerLikeRows += 1
  }

  keywordDenom += Math.max(1, nonEmptyCells)
  const keywordScore = Math.min(1, keywordHits / keywordDenom)

  const densityScore =
    nonEmptyCells === 0 ? 0 : Math.min(1, numericCells / Math.max(1, nonEmptyCells))

  const headerScore = scanR === 0 ? 0 : Math.min(1, headerLikeRows / Math.min(12, scanR))

  const emptyRatio = totalSampled === 0 ? 1 : emptyCells / totalSampled
  const emptyPenalty = 1 - Math.min(1, emptyRatio * 1.2)

  const combined =
    keywordScore * 0.42 + densityScore * 0.28 + headerScore * 0.22 + emptyPenalty * 0.08

  const score = Math.round(Math.min(100, Math.max(0, combined * 100)) * 100) / 100

  return {
    sheetName,
    score,
    signals: {
      keywordScore: Math.round(keywordScore * 1000) / 1000,
      densityScore: Math.round(densityScore * 1000) / 1000,
      headerScore: Math.round(headerScore * 1000) / 1000,
    },
  }
}

export function detectRelevantSheets(params: { workbook: Record<string, unknown> }) {
  const ranked: SheetCandidate[] = Object.keys(params.workbook)
    .sort((a, b) => a.localeCompare(b))
    .map((sheetName) => {
      const rows = sheetToRows(params.workbook[sheetName])
      return scoreSheet(sheetName, rows)
    })
    .sort((a, b) => b.score - a.score)

  return {
    data: { rankedSheets: ranked },
    summary: { totalSheets: ranked.length, topSheet: ranked[0]?.sheetName ?? null },
    warnings:
      ranked.length === 0
        ? [
            {
              code: "excel_no_sheets",
              message: "Workbook has no named sheets to score",
              severity: "error" as const,
            },
          ]
        : ranked[0]!.score < 5
          ? [
              {
                code: "excel_low_sheet_confidence",
                message: "Highest-ranked sheet has very low relevance score",
                severity: "warning" as const,
              },
            ]
          : ([] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>),
  }
}
