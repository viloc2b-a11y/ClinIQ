/**
 * Document Engine v1 — bundle SoA / budget / invoice core payloads in one call (no ClinIQ core).
 */

import type { CoreBudgetReviewRow } from "./to-core-budget-review-rows"
import type { CoreInvoiceReviewRow } from "./to-core-invoice-review-rows"
import type { CoreSoaImportRow } from "./to-core-soa-import-rows"
import { toCoreBudgetReviewPayload } from "./to-core-budget-review-payload"
import { toCoreInvoiceReviewPayload } from "./to-core-invoice-review-payload"
import { toCoreSoaIntakePayload } from "./to-core-soa-intake-payload"

export type { CoreBudgetReviewRow, CoreInvoiceReviewRow, CoreSoaImportRow }

export type RunCorePayloadPackageSummary = {
  totalSoaRows: number
  totalBudgetRows: number
  totalInvoiceRows: number
  totalRows: number
  totalReadyRows: number
  totalRowsNeedingReview: number
}

export type RunCorePayloadPackageResult = {
  soaIntake: ReturnType<typeof toCoreSoaIntakePayload>
  budgetReview: ReturnType<typeof toCoreBudgetReviewPayload>
  invoiceReview: ReturnType<typeof toCoreInvoiceReviewPayload>
  summary: RunCorePayloadPackageSummary
  warnings: string[]
}

function mergeWarningsInOrder(batches: readonly string[][]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const batch of batches) {
    for (const w of batch) {
      if (!seen.has(w)) {
        seen.add(w)
        out.push(w)
      }
    }
  }
  return out
}

/**
 * Build all three intake/review payloads from core-ready rows (defaults empty arrays).
 */
export async function runCorePayloadPackage(input: {
  documentId?: string
  soaImportRows?: CoreSoaImportRow[]
  budgetReviewRows?: CoreBudgetReviewRow[]
  invoiceReviewRows?: CoreInvoiceReviewRow[]
}): Promise<RunCorePayloadPackageResult> {
  const { documentId, soaImportRows, budgetReviewRows, invoiceReviewRows } = input

  const soaIntake = toCoreSoaIntakePayload({
    documentId,
    rows: soaImportRows ?? [],
  })
  const budgetReview = toCoreBudgetReviewPayload({
    documentId,
    rows: budgetReviewRows ?? [],
  })
  const invoiceReview = toCoreInvoiceReviewPayload({
    documentId,
    rows: invoiceReviewRows ?? [],
  })

  const totalSoaRows = soaIntake.summary.totalRows
  const totalBudgetRows = budgetReview.summary.totalRows
  const totalInvoiceRows = invoiceReview.summary.totalRows

  const summary: RunCorePayloadPackageSummary = {
    totalSoaRows,
    totalBudgetRows,
    totalInvoiceRows,
    totalRows: totalSoaRows + totalBudgetRows + totalInvoiceRows,
    totalReadyRows:
      soaIntake.summary.readyCount +
      budgetReview.summary.readyCount +
      invoiceReview.summary.readyCount,
    totalRowsNeedingReview:
      soaIntake.summary.needsReviewCount +
      budgetReview.summary.needsReviewCount +
      invoiceReview.summary.needsReviewCount,
  }

  const warnings = mergeWarningsInOrder([
    soaIntake.warnings,
    budgetReview.warnings,
    invoiceReview.warnings,
  ])

  return {
    soaIntake,
    budgetReview,
    invoiceReview,
    summary,
    warnings,
  }
}
