import type { DocumentFixture } from "./types"

export function buildExcelMultiCandidateSheetsFixture(): DocumentFixture {
  return {
    id: "fixture-excel-multi-candidate-sheets",
    type: "excel_multi_candidate_sheets",
    fileName: "multi-candidate-sheets.xlsx",
    sourceType: "excel",
    workbook: {
      BudgetSummary: [
        ["Visit", "Activity", "Cost", "Qty"],
        ["Screening", "Labs", 100, 1],
      ],
      SoA: [
        ["Timepoint", "Procedure", "Fee", "Qty"],
        ["Baseline", "ECG", 200, 1],
      ],
      Notes: [
        ["Notes"],
        ["Ignore this sheet"],
      ],
    },
    metadata: {
      description: "Workbook with more than one plausible candidate sheet",
      tags: ["excel", "multi-sheet", "candidate-ranking", "edge-case"],
    },
  }
}
