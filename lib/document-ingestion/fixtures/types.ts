export type DocumentFixtureType =
  | "excel_simple_budget"
  | "excel_simple_soa"
  | "excel_multi_sheet_budget"
  | "excel_messy_budget"
  | "excel_visit_schedule"
  | "excel_sparse_budget"
  | "excel_noisy_header_budget"
  | "excel_duplicate_header_variant"
  | "excel_sectioned_budget"
  | "excel_multi_candidate_sheets"

export type DocumentFixture = {
  id: string
  type: DocumentFixtureType
  fileName: string
  sourceType: "excel"
  /** Flat map `sheetName -> row[][]`. Hardened Excel intake walks top-level array-valued keys only; nest under `Sheets` for real XLSX only after that layer unwraps. */
  workbook: Record<string, unknown>
  metadata: {
    description: string
    tags: string[]
  }
}
