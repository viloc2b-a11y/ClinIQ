import type { NegotiationEngineInput } from "./negotiation-input"

function fmtUsd(n: number): string {
  const sign = n < 0 ? "-" : ""
  const v = Math.round(Math.abs(n))
  const withCommas = v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `${sign}$${withCommas}`
}

function openingForDecision(decision: NegotiationEngineInput["decision"]): string {
  switch (decision) {
    case "reject":
      return (
        "The current budget is not executable against our modeled cost and risk profile. " +
        "We require a revised schedule of payments before we can commit site resources."
      )
    case "negotiate":
      return (
        "The budget is directionally workable but requires targeted increases so delivery, " +
        "documentation, and monitoring obligations remain sustainable and inspection-ready."
      )
    case "accept":
      return (
        "The proposed budget clears our sustainability threshold on this snapshot; " +
        "we are prepared to proceed subject to contract language and final scope confirmation."
      )
    default:
      return ""
  }
}

/**
 * Deterministic sponsor-facing counteroffer draft (no AI / network).
 */
export function generateCounterofferText(payload: NegotiationEngineInput): string {
  const study =
    payload.studyMeta.studyName ??
    payload.studyMeta.studyId ??
    "the study"
  const site = payload.studyMeta.siteName ?? "Our site"
  const linesOut: string[] = []

  linesOut.push(`Subject: Budget counterproposal — ${study}`)
  linesOut.push("")
  linesOut.push(`${site} — ${openingForDecision(payload.decision)}`)
  linesOut.push("")
  linesOut.push("Structured adjustment requests (to align with our internal cost model):")
  linesOut.push("")

  if (payload.topNegotiationTargets.length === 0) {
    linesOut.push(
      "(No line-specific increases flagged on this run—see summary totals if applicable.)",
    )
  } else {
    let i = 1
    for (const t of payload.topNegotiationTargets) {
      const increase =
        t.kind === "missing"
          ? t.internalTotal
          : Math.max(0, t.internalTotal - t.sponsorTotalOffer)
      linesOut.push(
        `${i}. [${t.lineCode}] ${t.label} (${t.visitName}) — increase ${fmtUsd(increase)} to reach modeled ${fmtUsd(t.internalTotal)} (${t.reason})`,
      )
      i += 1
    }
  }

  linesOut.push("")
  linesOut.push(
    `Study-level context: internal modeled ${fmtUsd(payload.summary.totalInternalRevenue)}, sponsor offer ${fmtUsd(payload.summary.totalSponsorRevenue)}, net gap ${fmtUsd(payload.summary.totalGap)}.`,
  )
  if (payload.summary.totalGapPerPatient !== null) {
    linesOut.push(
      `Per-patient gap on this budget cohort: ${fmtUsd(payload.summary.totalGapPerPatient)}.`,
    )
  }
  linesOut.push("")
  linesOut.push("Justification (workload, quality, compliance):")
  for (const p of payload.justificationPoints) {
    linesOut.push(`- ${p}`)
  }
  linesOut.push("")
  linesOut.push(
    "We are happy to walk through visit-level assumptions, delegation, pharmacy/lab handling, and regulatory filing burden so finance and medical affairs can align quickly.",
  )

  return linesOut.join("\n")
}
