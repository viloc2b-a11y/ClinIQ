/**
 * Document Engine v1 — orchestrate SoA structured activities → classification → initial expected billables (no ledger).
 */

import { buildInitialExpectedBillables } from "./build-initial-expected-billables"
import { classifyCoreSoaActivities } from "./classify-core-soa-activities"
import type { CoreSoaStructuredActivity } from "./to-core-soa-structured-input"

export type { CoreSoaStructuredActivity }

export type RunSoaToExpectedBillablesSummary = {
  totalActivities: number
  classifiedCount: number
  needsReviewClassificationCount: number
  expectedBillableCount: number
  readyExpectedBillableCount: number
  needsReviewExpectedBillableCount: number
}

export type RunSoaToExpectedBillablesResult = {
  classification: ReturnType<typeof classifyCoreSoaActivities>
  expectedBillables: ReturnType<typeof buildInitialExpectedBillables>
  summary: RunSoaToExpectedBillablesSummary
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
 * Run classifyCoreSoaActivities then buildInitialExpectedBillables on the same documentId.
 */
export async function runSoaToExpectedBillables(input: {
  documentId: string | null
  activities: CoreSoaStructuredActivity[]
}): Promise<RunSoaToExpectedBillablesResult> {
  const { documentId, activities } = input

  const classification = classifyCoreSoaActivities({
    documentId,
    activities,
  })

  const expectedBillables = buildInitialExpectedBillables({
    documentId,
    activities: classification.activities,
  })

  const summary: RunSoaToExpectedBillablesSummary = {
    totalActivities: classification.summary.totalActivities,
    classifiedCount: classification.summary.classifiedCount,
    needsReviewClassificationCount: classification.summary.needsReviewCount,
    expectedBillableCount: expectedBillables.summary.totalRows,
    readyExpectedBillableCount: expectedBillables.summary.readyCount,
    needsReviewExpectedBillableCount: expectedBillables.summary.needsReviewCount,
  }

  const warnings = mergeWarningsInOrder([classification.warnings, expectedBillables.warnings])

  return {
    classification,
    expectedBillables,
    summary,
    warnings,
  }
}
