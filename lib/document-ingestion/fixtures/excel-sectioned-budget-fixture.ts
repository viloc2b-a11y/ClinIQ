import type { DocumentFixture } from "./types"

export function buildExcelSectionedBudgetFixture(): DocumentFixture {
  return {
    id: "fixture-excel-sectioned-budget",
    type: "excel_sectioned_budget",
    fileName: "sectioned-budget.xlsx",
    sourceType: "excel",
    workbook: {
      Budget: [
        ["Visit", "Activity", "Cost", "Qty"],
        ["SCREENING", "", "", ""],
        ["Screening", "Labs", 100, 1],
        ["TREATMENT", "", "", ""],
        ["Day 1", "Infusion", 500, 1],
        ["FOLLOW-UP", "", "", ""],
        ["Day 7", "Phone Call", 50, 1],
      ],
    },
    metadata: {
      description: "Workbook with section-title rows embedded in the table",
      tags: ["excel", "sectioned", "budget", "edge-case"],
    },
  }
}
