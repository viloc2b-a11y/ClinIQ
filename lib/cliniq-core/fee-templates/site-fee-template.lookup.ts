import feeTemplate from "./site-fee-template.json"
import type {
  SiteFeeTemplateDocument,
  SiteFeeTemplateFee,
  SiteFeeTherapeuticAreaKey,
} from "./site-fee-template-types"

export { feeTemplate }

/** Typed default export (same data as JSON; use for better inference without casting). */
export const siteFeeTemplateTyped: SiteFeeTemplateDocument = feeTemplate

export function findSiteFeeByCode(
  feeCode: string,
  pack: SiteFeeTemplateDocument = feeTemplate,
): SiteFeeTemplateFee | undefined {
  return pack.siteFeeTemplateEngine.fees.find((f) => f.feeCode === feeCode)
}

/**
 * Recommended unit price: `complexityAdjusted[therapeuticArea]` when present,
 * otherwise `pricing.recommended` (number or string), otherwise `mid` / `low`.
 */
export function recommendedFeePriceWithComplexity(
  fee: SiteFeeTemplateFee,
  therapeuticArea?: SiteFeeTherapeuticAreaKey,
): number | string {
  if (
    therapeuticArea != null &&
    fee.complexityAdjusted?.[therapeuticArea] != null
  ) {
    return fee.complexityAdjusted[therapeuticArea]!
  }
  const rec = fee.pricing.recommended
  if (rec !== undefined) return rec
  if (fee.pricing.mid != null) return fee.pricing.mid
  if (fee.pricing.low != null) return fee.pricing.low
  return 0
}
