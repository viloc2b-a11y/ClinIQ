import type { InternalScenarioDefinition } from "./types"

export function listInternalScenarios() {
  const scenarios: InternalScenarioDefinition[] = [
    {
      key: "budget_simple_happy_path",
      label: "Budget Simple Happy Path",
      description: "Single-sheet simple budget scenario for full canonical demo flow",
      fixtureType: "excel_simple_budget",
      tags: ["budget", "simple", "happy-path", "excel"],
    },
    {
      key: "soa_simple_happy_path",
      label: "SoA Simple Happy Path",
      description: "Simple SoA schedule scenario for deterministic canonical flow",
      fixtureType: "excel_simple_soa",
      tags: ["soa", "simple", "schedule", "excel"],
    },
    {
      key: "budget_multi_sheet_detection",
      label: "Budget Multi-Sheet Detection",
      description: "Exercises relevant sheet selection from a multi-sheet workbook",
      fixtureType: "excel_multi_sheet_budget",
      tags: ["budget", "multi-sheet", "sheet-ranking", "excel"],
    },
    {
      key: "budget_messy_boundary_detection",
      label: "Budget Messy Boundary Detection",
      description: "Exercises boundary detection and row classification on messy workbook layout",
      fixtureType: "excel_messy_budget",
      tags: ["budget", "messy", "boundary-detection", "excel"],
    },
    {
      key: "visit_schedule_basic",
      label: "Visit Schedule Basic",
      description: "Visit schedule scenario for canonical visit-oriented parsing flow",
      fixtureType: "excel_visit_schedule",
      tags: ["visit-schedule", "timepoint", "schedule", "excel"],
    },
    {
      key: "budget_sparse_rows",
      label: "Budget Sparse Rows",
      description: "Exercises sparse row handling inside a budget-like table",
      fixtureType: "excel_sparse_budget",
      tags: ["budget", "sparse", "edge-case", "excel"],
    },
    {
      key: "budget_noisy_headers",
      label: "Budget Noisy Headers",
      description: "Exercises header detection with pre-header noise and variant labels",
      fixtureType: "excel_noisy_header_budget",
      tags: ["budget", "headers", "noise", "excel"],
    },
    {
      key: "budget_duplicate_headers",
      label: "Budget Duplicate Headers",
      description: "Exercises repeated header rows inside a table body",
      fixtureType: "excel_duplicate_header_variant",
      tags: ["budget", "duplicate-header", "row-classification", "excel"],
    },
    {
      key: "budget_sectioned_layout",
      label: "Budget Sectioned Layout",
      description: "Exercises embedded section-title rows within a structured table",
      fixtureType: "excel_sectioned_budget",
      tags: ["budget", "sectioned", "edge-case", "excel"],
    },
    {
      key: "multi_candidate_sheet_selection",
      label: "Multi-Candidate Sheet Selection",
      description: "Exercises ranking when more than one sheet appears relevant",
      fixtureType: "excel_multi_candidate_sheets",
      tags: ["excel", "sheet-ranking", "multi-sheet", "edge-case"],
    },
  ]

  return {
    data: {
      scenarios,
    },
    summary: {
      totalScenarios: scenarios.length,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
