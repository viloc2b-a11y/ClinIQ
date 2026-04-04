import {
  budgetGapResultToNegotiationEngineInput,
  type NegotiationEngineInput,
} from "../budget-gap/negotiation-input"
import type { BudgetGapResult, BudgetStudyMeta } from "../budget-gap/types"
import { buildNegotiationPackage } from "./build-package"
import type { NegotiationPackage, NegotiationStrategy } from "./types"

/**
 * Programmatic handoff: Module 3 compare result → Module 4 package (pure).
 */
export function negotiationEngineInputFromGapResult(
  result: BudgetGapResult,
  studyMeta: BudgetStudyMeta,
  options?: { generatedAt?: string },
): NegotiationEngineInput {
  return budgetGapResultToNegotiationEngineInput(result, studyMeta, options)
}

export function negotiationPackageFromGapResult(
  result: BudgetGapResult,
  studyMeta: BudgetStudyMeta,
  strategy: NegotiationStrategy,
  options?: { generatedAt?: string },
): NegotiationPackage {
  const input = negotiationEngineInputFromGapResult(result, studyMeta, options)
  return buildNegotiationPackage({ input, strategy })
}
