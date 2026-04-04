/**
 * Module 4 v1 orchestration: `NegotiationEngineInput` → internal plan + external package + sponsor email.
 * Spine: `buildNegotiationPackage` only (no `runFullNegotiation`, no `counteroffer-text`).
 */

import type { NegotiationEngineInput } from "../budget-gap/negotiation-input"
import { buildNegotiationPackage } from "./build-package"
import { generateEmailDraft } from "./email-draft"
import type {
  BuildModule4ArtifactsParams,
  ExternalNegotiationPackage,
  InternalNegotiationPlan,
  Module4Artifacts,
} from "./module4-types"
import type { NegotiationPackage, PaymentTermRecommendation } from "./types"

function defaultStrategy() {
  return "balanced" as const
}

/**
 * Deterministic aggregate payment-term leverage from Module 3 posture + existing term flags.
 * Does not modify `payment-terms.ts` rules.
 */
function computePaymentLeveragePriority(
  input: NegotiationEngineInput,
  recommendations: PaymentTermRecommendation[],
): "low" | "medium" | "high" {
  const missing = input.missingInvoiceables.length
  const missingTargets = input.topNegotiationTargets.filter((t) => t.kind === "missing").length
  const lossTargets = input.topNegotiationTargets.filter((t) => t.kind === "loss").length
  const alertCount = input.risk.primaryAlerts.length
  const riskTermCount = recommendations.filter((r) => r.riskFlag).length
  const shortfall = input.summary.totalGap < -0.01
  const severeAlerts = alertCount >= 4

  if (
    missing >= 2 ||
    (missing >= 1 && missingTargets >= 1 && alertCount >= 2) ||
    (severeAlerts && shortfall && input.summary.negativeCashFlowRisk)
  ) {
    return "high"
  }

  if (
    missing >= 1 ||
    missingTargets + lossTargets >= 2 ||
    riskTermCount >= 2 ||
    (input.summary.negativeCashFlowRisk && shortfall)
  ) {
    return "medium"
  }

  return "low"
}

function buildExternalSummary(
  input: NegotiationEngineInput,
): ExternalNegotiationPackage["summary"] {
  const study = input.studyMeta.studyName ?? input.studyMeta.studyId ?? "Study"
  const headline = `${study} — budget alignment (${input.decision})`
  const keyPoints = input.risk.primaryAlerts.slice(0, 8)
  return {
    headline,
    keyPoints,
    totalInternal: input.summary.totalInternalRevenue,
    totalSponsor: input.summary.totalSponsorRevenue,
    totalGap: input.summary.totalGap,
    negativeCashFlowRisk: input.summary.negativeCashFlowRisk,
    decision: input.decision,
  }
}

/** `NegotiationPackage` shape consumed by `generateEmailDraft`, built only from `ExternalNegotiationPackage`. */
function negotiationPackageFromExternal(
  ext: ExternalNegotiationPackage,
  generatedAt: string,
): NegotiationPackage {
  return {
    schemaVersion: "1.0",
    strategy: ext.strategy,
    generatedAt,
    studyId: ext.studyId,
    studyName: ext.studyName,
    siteName: ext.siteName,
    counterofferLines: ext.counterofferLines,
    justifications: [],
    paymentTerms: ext.paymentTerms,
    summarySnapshot: {
      totalInternal: ext.summary.totalInternal,
      totalSponsor: ext.summary.totalSponsor,
      totalGap: ext.summary.totalGap,
      negativeCashFlowRisk: ext.summary.negativeCashFlowRisk,
      decision: ext.summary.decision,
    },
  }
}

export function buildModule4Artifacts(
  params: BuildModule4ArtifactsParams,
): Module4Artifacts {
  const { input, sponsorNegotiationHooks } = params
  const strategy = params.strategy ?? defaultStrategy()

  const pkg = buildNegotiationPackage({ input, strategy })
  const recommendations = pkg.paymentTerms
  const priority = computePaymentLeveragePriority(input, recommendations)

  const externalPackage: ExternalNegotiationPackage = {
    counterofferLines: pkg.counterofferLines,
    paymentTerms: recommendations,
    summary: buildExternalSummary(input),
    studyId: pkg.studyId,
    studyName: pkg.studyName,
    siteName: pkg.siteName,
    strategy,
  }

  const internalPlan: InternalNegotiationPlan = {
    decision: input.decision,
    strategy,
    selectedLineCodes: pkg.counterofferLines.map((l) => l.lineCode),
    topTargets: input.topNegotiationTargets.map(
      (t) => `${t.lineCode} — ${t.label} (${t.kind})`,
    ),
    risks: [...input.risk.primaryAlerts],
    justificationPoints: [...input.justificationPoints],
    paymentLeverage: {
      recommendations,
      priority,
    },
    internalNotes:
      sponsorNegotiationHooks?.internalNotesAppend &&
      sponsorNegotiationHooks.internalNotesAppend.length > 0
        ? [...sponsorNegotiationHooks.internalNotesAppend]
        : undefined,
  }

  const emailDraft = generateEmailDraft(
    negotiationPackageFromExternal(externalPackage, pkg.generatedAt),
  )

  return { internalPlan, externalPackage, emailDraft }
}
