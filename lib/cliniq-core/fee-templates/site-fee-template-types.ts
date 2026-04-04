/**
 * Types for `site-fee-template.json` (Houston site fee pack / negotiation engine).
 */

export type SiteFeeTherapeuticAreaKey =
  | "vaccine"
  | "vaccine_combo"
  | "cardiovascular"
  | "respiratory"
  | "diabetes"
  | "gastro"
  | "neurology"
  | "default"

export type SiteFeePricing = {
  low?: number
  mid?: number
  high?: number
  /** Dollar amount or strategy label (e.g. pass-through rows). */
  recommended?: number | string
  unit?: string
  markupOnCost?: number
  minMarkupFloor?: number
  adminMarkup?: number
}

export type SiteFeeTemplateFee = {
  feeCode: string
  feeName: string
  category: string
  unit: string
  trigger: string
  billing: string
  paymentTerms: string
  priority: string
  negotiationCategory: string
  minAcceptablePercent: number
  maxConcession: number
  pricing: SiteFeePricing
  complexityAdjusted?: Partial<Record<SiteFeeTherapeuticAreaKey, number>>
  markupOnCost?: number
  justificationTemplate: string
  paymentStrategy: string
  notes: string
}

export type SiteFeeTemplateEngine = {
  version: string
  market: string
  calibrationYear: string
  currency: string
  siteType: string
  complexityMultipliers: Record<SiteFeeTherapeuticAreaKey, number>
  defaultOverheadRate: number
  defaultMarginTarget: number
  fees: SiteFeeTemplateFee[]
  negotiationGlobalRules: {
    strongModeThreshold: number
    mustWinDeficitThreshold: number
    defaultPaymentTerms: {
      standard: string
      holdbackMax: string
      holdbackStrongMode: string
      startupPayment: string
      startupStrongMode: string
      invoiceablesPayment: string
      closeoutRelease: string
    }
    fallbackStrategy: string
  }
}

export type SiteFeeTemplateDocument = {
  siteFeeTemplateEngine: SiteFeeTemplateEngine
}
