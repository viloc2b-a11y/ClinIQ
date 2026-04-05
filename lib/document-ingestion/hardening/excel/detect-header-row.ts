export function detectHeaderRow(rows: string[][]): number {
  let bestIndex = -1
  let bestScore = -1

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] || []
    const normalized = row.map((c) => c.toLowerCase().trim())
    const score = normalized.filter((c) =>
      c.includes("visit") ||
      c.includes("procedure") ||
      c.includes("activity") ||
      c.includes("fee") ||
      c.includes("amount") ||
      c.includes("event") ||
      c.includes("schedule"),
    ).length

    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  return bestScore > 0 ? bestIndex : -1
}
