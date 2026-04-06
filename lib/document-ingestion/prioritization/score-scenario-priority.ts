import type { ScenarioCatalogEntry } from "../scenario-catalog/types"

export function scoreScenarioPriority(entry: ScenarioCatalogEntry) {
  let score = 0
  const reasons: string[] = []

  // Excel priority boost
  if (entry.sourceType === "excel") {
    score += 3
    reasons.push("excel_source")
  }

  // Edge-case tags increase priority
  if (entry.tags.includes("edge-case")) {
    score += 3
    reasons.push("edge_case")
  }

  // Multi-table / fragmented structures are harder and should be prioritized
  if (entry.tags.includes("multi-table")) {
    score += 2
    reasons.push("multi_table")
  }

  if (entry.tags.includes("fragmented")) {
    score += 2
    reasons.push("fragmented")
  }

  // Messy headers strongly affect downstream reliability
  if (entry.tags.includes("messy-headers")) {
    score += 2
    reasons.push("messy_headers")
  }

  if (entry.tags.includes("duplicate-headers")) {
    score += 2
    reasons.push("duplicate_headers")
  }

  // Sparse / blank-row / spacer issues are common operational failure points
  if (entry.tags.includes("blank-rows")) {
    score += 1
    reasons.push("blank_rows")
  }

  if (entry.tags.includes("sparse-layout")) {
    score += 1
    reasons.push("sparse_layout")
  }

  // Cross-sheet or mixed-content scenarios raise normalization risk
  if (entry.tags.includes("multi-sheet")) {
    score += 2
    reasons.push("multi_sheet")
  }

  if (entry.tags.includes("mixed-content")) {
    score += 2
    reasons.push("mixed_content")
  }

  // Unknown / ambiguous structure deserves hardening attention
  if (entry.tags.includes("unknown-shape")) {
    score += 2
    reasons.push("unknown_shape")
  }

  if (entry.tags.includes("ambiguous")) {
    score += 2
    reasons.push("ambiguous")
  }

  // If the scenario covers core intake classes, prioritize it
  if (entry.documentKind === "soa") {
    score += 2
    reasons.push("soa_kind")
  }

  if (entry.documentKind === "sponsor_budget") {
    score += 2
    reasons.push("budget_kind")
  }

  if (entry.documentKind === "invoice") {
    score += 2
    reasons.push("invoice_kind")
  }

  let priority: "high" | "medium" | "low" = "low"
  if (score >= 8) priority = "high"
  else if (score >= 4) priority = "medium"

  return {
    score,
    priority,
    reasons,
  }
}
