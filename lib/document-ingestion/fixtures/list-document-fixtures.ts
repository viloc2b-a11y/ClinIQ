import { buildExcelDuplicateHeaderVariantFixture } from "./excel-duplicate-header-variant-fixture"
import { buildExcelMessyBudgetFixture } from "./excel-messy-budget-fixture"
import { buildExcelMultiCandidateSheetsFixture } from "./excel-multi-candidate-sheets-fixture"
import { buildExcelMultiSheetBudgetFixture } from "./excel-multi-sheet-budget-fixture"
import { buildExcelNoisyHeaderBudgetFixture } from "./excel-noisy-header-budget-fixture"
import { buildExcelSectionedBudgetFixture } from "./excel-sectioned-budget-fixture"
import { buildExcelSimpleBudgetFixture } from "./excel-simple-budget-fixture"
import { buildExcelSimpleSoaFixture } from "./excel-simple-soa-fixture"
import { buildExcelSparseBudgetFixture } from "./excel-sparse-budget-fixture"
import { buildExcelVisitScheduleFixture } from "./excel-visit-schedule-fixture"

export function listDocumentFixtures() {
  const fixtures = [
    buildExcelSimpleBudgetFixture(),
    buildExcelSimpleSoaFixture(),
    buildExcelMultiSheetBudgetFixture(),
    buildExcelMessyBudgetFixture(),
    buildExcelVisitScheduleFixture(),
    buildExcelSparseBudgetFixture(),
    buildExcelNoisyHeaderBudgetFixture(),
    buildExcelDuplicateHeaderVariantFixture(),
    buildExcelSectionedBudgetFixture(),
    buildExcelMultiCandidateSheetsFixture(),
  ]

  return {
    data: {
      fixtures,
    },
    summary: {
      totalFixtures: fixtures.length,
    },
    warnings: [] as Array<{ code: string; message: string; severity: "info" | "warning" | "error" }>,
  }
}
