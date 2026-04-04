import type { NegotiationPackage, SponsorEmailDraft } from "./types"

function fmtUsd(n: number): string {
  const v = Math.round(Math.abs(n))
  const s = v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `${n < 0 ? "-" : ""}$${s}`
}

/** Deterministic sponsor-facing email scaffold from a built package. */
export function generateEmailDraft(pkg: NegotiationPackage): SponsorEmailDraft {
  const site = pkg.siteName ?? "Our site"
  const study = pkg.studyName ?? pkg.studyId ?? "the study"

  const subject = `Budget revision request — ${study} (${site})`

  const opening = `${site} has completed an internal cost review for ${study}. We are aligned on the science and timelines; we need budget adjustments so we can execute with the staffing, pharmacy, and documentation quality both parties expect.`

  const rationaleParagraph = `Our modeled costs reflect coordinator and PI time, pharmacy and lab logistics, regulatory binder work, and sponsor query cycles. The current grid leaves a ${fmtUsd(Math.abs(pkg.summarySnapshot.totalGap))} variance versus that model on compared lines${pkg.summarySnapshot.negativeCashFlowRisk ? ", which creates cash-flow pressure for a site of our size" : ""}. The adjustments below are structured and proportional—not a generic uplift.`

  const adjustmentBullets = pkg.counterofferLines.map((l) => {
    const inc = l.recommendedCounteroffer - l.sponsorOffer
    return `${l.lineCode} — ${l.label}: move from ${fmtUsd(l.sponsorOffer)} to ${fmtUsd(l.recommendedCounteroffer)} (${inc >= 0 ? "+" : ""}${fmtUsd(inc)}).`
  })

  const paymentBits = pkg.paymentTerms.map((p) => p.recommendedTermChange)
  const paymentTermParagraph =
    paymentBits.length > 0
      ? `Payment terms: we propose the following: ${paymentBits.slice(0, 4).join(" ")}${paymentBits.length > 4 ? " Additional details are available on request." : ""}`
      : "Payment terms: we are open to aligning on cadence and holdbacks that keep the site liquid without shifting risk to patients."

  const closing = `We welcome a short working session with your clinical operations and finance contacts to finalize line items and payment timing. Please confirm receipt and suggest times this week.`

  const fullText = [
    subject,
    "",
    opening,
    "",
    rationaleParagraph,
    "",
    "Requested adjustments:",
    ...adjustmentBullets.map((b) => `• ${b}`),
    "",
    paymentTermParagraph,
    "",
    closing,
  ].join("\n")

  return {
    subject,
    opening,
    rationaleParagraph,
    adjustmentBullets,
    paymentTermParagraph,
    closing,
    fullText,
  }
}
