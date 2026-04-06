import type { DocumentFixture } from "./types"

export function buildExcelMultiSheetBudgetFixture(): DocumentFixture {
  return {
    id: "fixture-excel-multi-sheet-budget",
    type: "excel_multi_sheet_budget",
    fileName: "multi-sheet-budget.xlsx",
    sourceType: "excel",
    workbook: {
      Notes: [
        ["General Notes"],
        ["Ignore this sheet"],
      ],
      Summary: [
        ["Protocol Budget Summary"],
        ["Not the main table"],
      ],
      Budget: [
        ["Visit", "Activity", "Cost", "Qty"],
        ["Screening", "Labs", 100, 1],
        ["Day 1", "Imaging", 450, 1],
      ],
    },
    metadata: {
      description: "Workbook with multiple sheets to exercise relevant sheet detection",
      tags: ["excel", "budget", "multi-sheet", "sheet-ranking"],
    },
  }
}
