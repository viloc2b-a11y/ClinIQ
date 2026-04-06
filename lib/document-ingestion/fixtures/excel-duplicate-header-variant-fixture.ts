import type { DocumentFixture } from "./types"

export function buildExcelDuplicateHeaderVariantFixture(): DocumentFixture {
  return {
    id: "fixture-excel-duplicate-header-variant",
    type: "excel_duplicate_header_variant",
    fileName: "duplicate-header-variant.xlsx",
    sourceType: "excel",
    workbook: {
      Budget: [
        ["Visit", "Procedure", "Fee", "Qty"],
        ["Screening", "CBC", 125, 1],
        ["Visit", "Procedure", "Fee", "Qty"],
        ["Baseline", "ECG", 200, 1],
      ],
    },
    metadata: {
      description: "Workbook with repeated header rows inside the table",
      tags: ["excel", "duplicate-header", "edge-case", "row-classification"],
    },
  }
}
