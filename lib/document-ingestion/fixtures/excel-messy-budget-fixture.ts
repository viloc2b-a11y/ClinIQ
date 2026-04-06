import type { DocumentFixture } from "./types"

export function buildExcelMessyBudgetFixture(): DocumentFixture {
  return {
    id: "fixture-excel-messy-budget",
    type: "excel_messy_budget",
    fileName: "messy-budget.xlsx",
    sourceType: "excel",
    workbook: {
      BudgetDraft: [
        ["Draft Budget"],
        [],
        ["Visit Name", "Service", "Amount", "Units"],
        ["Screening", "Local Labs", 95, 1],
        ["", "", "", ""],
        ["Day 1", "Physical", 150, 1],
        [],
        [],
      ],
    },
    metadata: {
      description: "Messy workbook with spacer rows and non-tabular content",
      tags: ["excel", "budget", "messy", "boundary-detection"],
    },
  }
}
