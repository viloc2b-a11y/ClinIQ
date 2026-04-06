import type { ScenarioFamilyDefinition } from "./types"

export function listScenarioFamilies() {
  const families: ScenarioFamilyDefinition[] = [
    {
      key: "happy_path",
      label: "Happy Path",
      description: "Straightforward deterministic scenarios used as baseline flow coverage",
      scenarioKeys: ["budget_simple_happy_path", "soa_simple_happy_path"],
    },
    {
      key: "sheet_selection",
      label: "Sheet Selection",
      description: "Scenarios that exercise relevant sheet ranking and selection behavior",
      scenarioKeys: ["budget_multi_sheet_detection", "multi_candidate_sheet_selection"],
    },
    {
      key: "boundary_detection",
      label: "Boundary Detection",
      description: "Scenarios that exercise start/end table boundary detection in noisy layouts",
      scenarioKeys: ["budget_messy_boundary_detection"],
    },
    {
      key: "header_variants",
      label: "Header Variants",
      description: "Scenarios that exercise header normalization and repeated/variant headers",
      scenarioKeys: ["budget_noisy_headers", "budget_duplicate_headers"],
    },
    {
      key: "row_structure",
      label: "Row Structure",
      description: "Scenarios that exercise sparse rows, section rows, and row-shape irregularities",
      scenarioKeys: ["budget_sparse_rows", "budget_sectioned_layout"],
    },
    {
      key: "visit_schedule",
      label: "Visit Schedule",
      description: "Scenarios oriented around visit/timepoint style workbook structures",
      scenarioKeys: ["visit_schedule_basic"],
    },
  ]

  return {
    data: {
      families,
    },
    summary: {
      totalFamilies: families.length,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
