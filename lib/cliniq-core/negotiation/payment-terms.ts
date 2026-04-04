import type { NegotiationEngineInput } from "../budget-gap/negotiation-input"
import type { PaymentTermRecommendation } from "./types"

function norm(s: string): string {
  return s.toLowerCase()
}

/**
 * Deterministic payment-term suggestions from gap posture and line mix.
 */
export function recommendPaymentTerms(
  input: NegotiationEngineInput,
): PaymentTermRecommendation[] {
  const recs: PaymentTermRecommendation[] = []
  const { summary, lines, missingInvoiceables, topNegotiationTargets } = input
  const catBlob = [
    ...lines.map((l) => l.category),
    ...topNegotiationTargets.map((t) => t.category),
  ]
    .join(" ")
    .toLowerCase()

  if (summary.negativeCashFlowRisk || summary.totalGap < 0) {
    recs.push({
      recommendedTermChange:
        "Invoice on a monthly cadence (or per completed patient milestone) rather than quarterly-only batches.",
      rationale:
        "More frequent settlement improves cash timing so coordinator and PI coverage can stay continuous.",
      riskFlag: summary.negativeCashFlowRisk,
    })
    recs.push({
      recommendedTermChange:
        "Cap pass-through holdbacks (e.g., lab/shipping) at a low percentage or reimburse net-30 from receipt.",
      rationale:
        "Pass-through costs are not margin; delaying them concentrates liquidity risk at the site.",
      riskFlag: true,
    })
  }

  if (catBlob.includes("startup") || norm(catBlob).includes("activation")) {
    recs.push({
      recommendedTermChange:
        "Startup fee: payable upon contract execution (or first SIV), non-refundable once activation work begins.",
      rationale:
        "Activation effort is committed before enrollment; upfront payment matches when cost is incurred.",
      riskFlag: false,
    })
  }

  if (
    missingInvoiceables.length > 0 ||
    catBlob.includes("screen failure") ||
    catBlob.includes("screen fail")
  ) {
    recs.push({
      recommendedTermChange:
        "Add an explicit, per-procedure screen-failure fee payable when qualifying work is completed.",
      rationale:
        "A defined fee prevents ambiguity and aligns sponsor reporting with documented screening effort.",
      riskFlag: missingInvoiceables.length > 0,
    })
  }

  if (catBlob.includes("amendment") || catBlob.includes("regulatory")) {
    recs.push({
      recommendedTermChange:
        "Regulatory / amendment review priced as a separate line item, payable when submitted to IRB or sponsor.",
      rationale:
        "Amendment cycles are bursty; separating them avoids diluting per-visit economics.",
      riskFlag: false,
    })
  }

  if (catBlob.includes("lab") || catBlob.includes("specimen") || catBlob.includes("dry ice")) {
    recs.push({
      recommendedTermChange:
        "Label specimen handling, dry ice, and courier charges as explicitly reimbursable with receipts.",
      rationale:
        "Clear reimbursement language reduces dispute risk and protects the site from uncapped logistics drag.",
      riskFlag: false,
    })
  }

  return recs
}
