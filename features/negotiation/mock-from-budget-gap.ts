import { compareSponsorBudgetToInternalBudget } from "@/lib/cliniq-core/budget-gap/compare"
import {
  budgetGapResultToNegotiationEngineInput,
  type NegotiationEngineInput,
} from "@/lib/cliniq-core/budget-gap/negotiation-input"
import {
  houstonKatyDiabetesStudyMeta,
  houstonKatyInternalBudgetLines,
  houstonKatySponsorBudgetLines,
} from "@/features/budget-gap/mock-houston-diabetes"

/**
 * Realistic Module 3 output for Houston/Katy metabolic scenario (underpaid startup,
 * screening, close-out; missing screen failure; negative cash-flow risk in summary).
 * Does not modify Module 3 source — composes public APIs + existing mock lines only.
 */
export function buildHoustonMetabolicNegotiationInput(): NegotiationEngineInput {
  const result = compareSponsorBudgetToInternalBudget({
    internalLines: houstonKatyInternalBudgetLines,
    sponsorLines: houstonKatySponsorBudgetLines,
    studyMeta: houstonKatyDiabetesStudyMeta,
  })
  return budgetGapResultToNegotiationEngineInput(
    result,
    houstonKatyDiabetesStudyMeta,
  )
}
