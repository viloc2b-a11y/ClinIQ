import type { DocumentFixture } from "./types"

export function buildExcelSimpleBudgetFixture(): DocumentFixture {
  return {
    id: "fixture-excel-simple-budget",
    type: "excel_simple_budget",
    fileName: "simple-budget.xlsx",
    sourceType: "excel",
    workbook: {
      Sheet1: [
        ["Visit", "Procedure", "Fee"],
        ["Screening", "Labs", "100"],
        ["Day 1", "Physical Exam", "150"],
        ["Baseline", "ECG", "200"],
      ],
    },
    metadata: {
      description:
        "Simple single-sheet budget workbook (Sheet1, Visit/Procedure/Fee) aligned with stable canonical demo grids",
      tags: ["excel", "budget", "simple", "single-sheet"],
    },
  }
}
