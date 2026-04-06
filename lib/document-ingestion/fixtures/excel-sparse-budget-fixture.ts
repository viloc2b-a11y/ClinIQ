import type { DocumentFixture } from "./types"

export function buildExcelSparseBudgetFixture(): DocumentFixture {
  return {
    id: "fixture-excel-sparse-budget",
    type: "excel_sparse_budget",
    fileName: "sparse-budget.xlsx",
    sourceType: "excel",
    workbook: {
      Budget: [
        ["Visit", "Activity", "Cost", "Qty"],
        ["Screening", "Labs", 100, 1],
        ["", "", "", ""],
        ["Day 1", "", 150, 1],
        ["", "", "", ""],
        ["Day 7", "ECG", "", 1],
      ],
    },
    metadata: {
      description: "Sparse budget workbook with blanks inside otherwise usable table",
      tags: ["excel", "budget", "sparse", "edge-case"],
    },
  }
}
