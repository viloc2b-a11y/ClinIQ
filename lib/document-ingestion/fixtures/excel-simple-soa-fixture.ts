import type { DocumentFixture } from "./types"

export function buildExcelSimpleSoaFixture(): DocumentFixture {
  return {
    id: "fixture-excel-simple-soa",
    type: "excel_simple_soa",
    fileName: "simple-soa.xlsx",
    sourceType: "excel",
    workbook: {
      Schedule: [
        ["Visit", "Procedure", "Fee", "Qty"],
        ["Screening", "CBC", 125, 1],
        ["Baseline", "ECG", 200, 1],
      ],
    },
    metadata: {
      description: "Simple SoA-style workbook for deterministic ingestion",
      tags: ["excel", "soa", "simple", "schedule"],
    },
  }
}
