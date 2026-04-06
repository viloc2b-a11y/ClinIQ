import type { DocumentFixture } from "./types"

export function buildExcelNoisyHeaderBudgetFixture(): DocumentFixture {
  return {
    id: "fixture-excel-noisy-header-budget",
    type: "excel_noisy_header_budget",
    fileName: "noisy-header-budget.xlsx",
    sourceType: "excel",
    workbook: {
      BudgetDraft: [
        ["Protocol Budget Draft v3"],
        ["For internal discussion only"],
        ["Visit Name", "Service Description", "Amount", "Units"],
        ["Screening", "Local Labs", 95, 1],
        ["Day 1", "Physical Exam", 150, 1],
      ],
    },
    metadata: {
      description: "Budget workbook with pre-header noise rows and non-canonical headers",
      tags: ["excel", "budget", "noisy-header", "edge-case"],
    },
  }
}
