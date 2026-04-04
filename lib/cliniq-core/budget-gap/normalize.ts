import { applyBudgetLabelAliases } from "./label-aliases"

export function normalizeMatchToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

/** Generic fee/sum words; do not strip "visit" (category is often "Visit"). */
const BUDGET_MATCH_NOISE = /\b(fee|lump|sum|each)\b/gi

/** Drop redundant "visit" after a canonical token (e.g. "__screening__ visit"). */
const VISIT_AFTER_CANON = /(__[a-z_]+__)\s+visit\b/gi

function collapseDuplicateCanonicalTokens(s: string): string {
  const parts = s.split(/\s+/).filter(Boolean)
  const out: string[] = []
  for (const p of parts) {
    const prev = out[out.length - 1]
    if (
      p.startsWith("__") &&
      p.endsWith("__") &&
      prev === p
    ) {
      continue
    }
    out.push(p)
  }
  return out.join(" ")
}

/**
 * Normalizes one field with synonym → canonical token expansion (startup, SCR, FU, etc.).
 */
export function normalizeFieldForBudgetMatch(value: string): string {
  let s = applyBudgetLabelAliases(value || "")
  s = s.replace(VISIT_AFTER_CANON, "$1")
  s = s.replace(BUDGET_MATCH_NOISE, " ")
  s = collapseDuplicateCanonicalTokens(s)
  return s.replace(/\s+/g, " ").trim()
}

/**
 * Match sponsor ↔ internal on alias-normalized category + visit + label.
 */
export function budgetLineMatchKey(line: {
  category: string
  visitName: string
  label: string
}): string {
  return [
    normalizeFieldForBudgetMatch(line.category),
    normalizeFieldForBudgetMatch(line.visitName),
    normalizeFieldForBudgetMatch(line.label),
  ].join("||")
}
