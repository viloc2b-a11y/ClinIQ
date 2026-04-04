/**
 * Typed “full scenario” payloads that combine fee context, HBR role rates,
 * and site economics — map into Cost Truth (`RoleCost`, `SiteCostProfile`) and site fee JSON.
 */

import type { RoleCost, SiteCostProfile } from "../cost-truth/cost-types"
import type { SiteFeePricing, SiteFeeTherapeuticAreaKey } from "./site-fee-template-types"

/** Houston-style hourly burdened rates ($/hr) keyed by role. */
export type ClinicalRoleCostsRecord = {
  CRC: number
  PI: number
  SubI: number
  Lab: number
  Admin: number
}

export type ClinicalFeeReferenceSlice = {
  feeCode: string
  pricing: SiteFeePricing
  complexityAdjusted?: Partial<Record<SiteFeeTherapeuticAreaKey, number>>
  negotiationCategory: string
  minAcceptablePercent: number
  maxConcession: number
  justificationTemplate: string
  paymentTerms: string
  billing: string
  trigger: string
}

export type ClinicalSiteCostContext = {
  overheadRate: number
  marginTarget: number
  nnnMonthly: number
  market: string
  siteType: string
  calibrationYear: string
  feeReferenceData: ClinicalFeeReferenceSlice
}

export type ClinicalProcedureContext = {
  feeCode: string
  feeName: string
  category: string
  unit: string
  quantity: number
  /** Aligns with `SiteFeeTherapeuticAreaKey` / site pack rows. */
  therapeuticArea: SiteFeeTherapeuticAreaKey | string
  complexityMultiplier: number
}

export type ClinicalCostScenarioPayload = {
  procedure: ClinicalProcedureContext
  roleCosts: ClinicalRoleCostsRecord
  siteCostProfile: ClinicalSiteCostContext
}

const ROLE_ORDER: (keyof ClinicalRoleCostsRecord)[] = [
  "CRC",
  "PI",
  "SubI",
  "Lab",
  "Admin",
]

/** Map record → Cost Truth `RoleCost[]` with stable `role_code` keys. */
export function clinicalRoleCostsToRoleCosts(
  record: ClinicalRoleCostsRecord,
): RoleCost[] {
  return ROLE_ORDER.map((key) => ({
    role_code: key,
    hourly_cost: record[key],
  }))
}

/** Strip extended site context down to Cost Truth `SiteCostProfile`. */
export function clinicalSiteContextToSiteCostProfile(
  ctx: Pick<ClinicalSiteCostContext, "overheadRate" | "marginTarget">,
): SiteCostProfile {
  return {
    overhead_percent: ctx.overheadRate,
    margin_target: ctx.marginTarget,
  }
}

/**
 * Example: Screening Visit (V1), diabetes — PP-SCR-001 with Houston HBR rates
 * and fee reference aligned to `site-fee-template.json`.
 */
export const CLINICAL_COST_SCREENING_DIABETES_EXAMPLE: ClinicalCostScenarioPayload =
  {
    procedure: {
      feeCode: "PP-SCR-001",
      feeName: "Screening Visit (V1)",
      category: "PerPatient",
      unit: "Visit",
      quantity: 1,
      therapeuticArea: "diabetes",
      complexityMultiplier: 1.25,
    },

    roleCosts: {
      CRC: 82.5,
      PI: 185.0,
      SubI: 145.0,
      Lab: 55.0,
      Admin: 38.0,
    },

    siteCostProfile: {
      overheadRate: 0.32,
      marginTarget: 0.2,
      nnnMonthly: 4200,
      market: "Houston/Texas",
      siteType: "small_independent",
      calibrationYear: "2025-2026",

      feeReferenceData: {
        feeCode: "PP-SCR-001",
        pricing: {
          low: 380,
          mid: 520,
          high: 680,
          recommended: 520,
        },
        complexityAdjusted: {
          vaccine: 380,
          cardiovascular: 437,
          diabetes: 520,
          neurology: 624,
          gastro: 572,
        },
        negotiationCategory: "MustWin",
        minAcceptablePercent: 0.9,
        maxConcession: 0.1,
        justificationTemplate:
          "Includes informed consent (avg 60-70 min), complete medical history, ECG, laboratory draws, physical exam and data entry with complexity buffer applied per therapeutic area.",
        paymentTerms: "Net-30",
        billing: "monthly",
        trigger: "screening_visit_completed",
      },
    },
  }
