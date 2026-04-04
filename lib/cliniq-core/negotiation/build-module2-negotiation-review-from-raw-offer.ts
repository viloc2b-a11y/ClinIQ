/**
 * Module 2 — convenience: raw sponsor offers → normalize → full negotiation review.
 */

import type { FeeFamily, SiteCostModelOutput } from "../cost-model/cost-model-types"
import {
  buildModule2NegotiationReview,
  type Module2NegotiationReview,
} from "./build-module2-negotiation-review"
import {
  normalizeSponsorOfferRecord,
  normalizeSponsorOfferRows,
  type RawSponsorOfferRow,
} from "./normalize-sponsor-offer-input"

export interface Module2NegotiationReviewFromRawOfferResult {
  normalizedOffers: Partial<Record<FeeFamily, number | null>>
  warnings: string[]
  unmatched: Array<{
    rawKey: string
    amount: number | null
  }>
  review: Module2NegotiationReview
}

type BuildFromRawOfferBaseParams = {
  costOutput: SiteCostModelOutput
  projectedRevenue: number
  feeNotesByFeeFamily?: Partial<Record<FeeFamily, string>>
  studyId?: string
  siteId?: string
}

function toResult(
  normalized: ReturnType<typeof normalizeSponsorOfferRecord>,
  base: BuildFromRawOfferBaseParams,
): Module2NegotiationReviewFromRawOfferResult {
  const review = buildModule2NegotiationReview({
    costOutput: base.costOutput,
    projectedRevenue: base.projectedRevenue,
    sponsorOfferByFeeFamily: normalized.offers,
    feeNotesByFeeFamily: base.feeNotesByFeeFamily,
    studyId: base.studyId,
    siteId: base.siteId,
  })

  return {
    normalizedOffers: normalized.offers,
    warnings: normalized.warnings,
    unmatched: normalized.unmatched,
    review,
  }
}

export function buildModule2NegotiationReviewFromOfferRecord(
  params: BuildFromRawOfferBaseParams & {
    rawSponsorOfferRecord: Record<string, number | null | undefined>
  },
): Module2NegotiationReviewFromRawOfferResult {
  const normalized = normalizeSponsorOfferRecord(params.rawSponsorOfferRecord)
  const { rawSponsorOfferRecord: _, ...base } = params
  return toResult(normalized, base)
}

export function buildModule2NegotiationReviewFromOfferRows(
  params: BuildFromRawOfferBaseParams & {
    rawSponsorOfferRows: RawSponsorOfferRow[]
  },
): Module2NegotiationReviewFromRawOfferResult {
  const normalized = normalizeSponsorOfferRows(params.rawSponsorOfferRows)
  const { rawSponsorOfferRows: _, ...base } = params
  return toResult(normalized, base)
}
