/**
 * Document Engine v1 — package SoA / budget / invoice core bridges in one call (no ClinIQ core).
 */

import type { PreBudgetRow } from "../adapters/to-pre-budget-rows"
import type { PreInvoiceRow } from "../adapters/to-pre-invoice-rows"
import type { PreSoaRow } from "../adapters/to-pre-soa-rows"
import { toCoreBudgetReviewRows } from "./to-core-budget-review-rows"
import { toCoreInvoiceReviewRows } from "./to-core-invoice-review-rows"
import { toCoreSoaImportRows } from "./to-core-soa-import-rows"

export type { PreBudgetRow, PreInvoiceRow, PreSoaRow }

export type RunCoreBridgePackageSummary = {
  totalSoaRows: number
  totalBudgetRows: number
  totalInvoiceRows: number
  totalRows: number
  totalNeedsReview: number
}

export type RunCoreBridgePackageResult = {
  soaImport: ReturnType<typeof toCoreSoaImportRows>
  budgetReview: ReturnType<typeof toCoreBudgetReviewRows>
  invoiceReview: ReturnType<typeof toCoreInvoiceReviewRows>
  summary: RunCoreBridgePackageSummary
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
 * Run all three core bridges with optional pre-* row inputs (default empty arrays).
 */
export async function runCoreBridgePackage(input: {
  documentId?: string
  preSoaRows?: PreSoaRow[]
  preBudgetRows?: PreBudgetRow[]
  preInvoiceRows?: PreInvoiceRow[]
}): Promise<RunCoreBridgePackageResult> {
  const { documentId, preSoaRows, preBudgetRows, preInvoiceRows } = input

  const soaImport = toCoreSoaImportRows({ documentId, rows: preSoaRows ?? [] })
  const budgetReview = toCoreBudgetReviewRows({ documentId, rows: preBudgetRows ?? [] })
  const invoiceReview = toCoreInvoiceReviewRows({ documentId, rows: preInvoiceRows ?? [] })

  const summary: RunCoreBridgePackageSummary = {
    totalSoaRows: soaImport.summary.totalOutputRows,
    totalBudgetRows: budgetReview.summary.totalOutputRows,
    totalInvoiceRows: invoiceReview.summary.totalOutputRows,
    totalRows:
      soaImport.summary.totalOutputRows +
      budgetReview.summary.totalOutputRows +
      invoiceReview.summary.totalOutputRows,
    totalNeedsReview:
      soaImport.summary.needsReviewCount +
      budgetReview.summary.needsReviewCount +
      invoiceReview.summary.needsReviewCount,
  }

  const warnings = mergeWarningsInOrder([
    soaImport.warnings,
    budgetReview.warnings,
    invoiceReview.warnings,
  ])

  return {
    soaImport,
    budgetReview,
    invoiceReview,
    summary,
    warnings,
  }
}
