/**
 * Deterministic sponsor-facing budget negotiation email from revenue decision + actions (no AI).
 */

export type NegotiationAction = {
  priority: number
  activityName: string
  visit: string
  impact: number
  urgency: "high" | "medium" | "low"
  negotiationText: string
}

export type RevenueDecision = {
  totalRevenueOpportunity: number
  revenueAtRisk: number
  coveragePercent: number
  decision: "SAFE" | "MODERATE_RISK" | "HIGH_RISK"
  headline: string
  topActions: {
    activity: string
    impact: number
    priority: number
  }[]
}

export type NegotiationEmailInput = {
  sponsorName?: string
  studyName?: string
  siteName?: string
  decision: RevenueDecision
  actions: NegotiationAction[]
}

export type NegotiationEmail = {
  subject: string
  body: string
}

function formatGapDollars(n: number): string {
  return String(Math.round(n))
}

/** Softer closing phrases for email tone (deterministic string replacements on engine headline). */
function headlineAsEmailProse(headline: string): string {
  const h = headline.trim()
  if (h.length === 0) {
    return "We have completed a structured review of budget coverage relative to protocol billables."
  }
  return h
    .replace(/ Immediate negotiation required\.$/, " We request budget revisions to align with protocol-driven site costs.")
    .replace(/ Targeted negotiation recommended\.$/, " We request targeted budget revisions to close the noted gaps.")
    .replace(/ No immediate negotiation required\.$/, " No further budget action is required at this time.")
}

function topThreeActions(actions: NegotiationAction[]): NegotiationAction[] {
  return [...actions]
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return b.impact - a.impact
    })
    .slice(0, 3)
}

export function buildNegotiationEmail(input: NegotiationEmailInput): NegotiationEmail {
  const { sponsorName, studyName, siteName, decision, actions } = input

  const subject = studyName?.trim()
    ? `Budget Clarification Request — ${studyName.trim()}`
    : "Budget Clarification Request"

  const greetingLine = sponsorName?.trim() ? `Dear ${sponsorName.trim()},` : "Dear Team,"

  const studyClause = studyName?.trim()
    ? `Following our review of the study budget for ${studyName.trim()}, we identified several protocol-required billable activities that are not currently reflected in the proposed budget, which affects reimbursement alignment for site execution.`
    : `Following our review of the study budget, we identified several protocol-required billable activities that are not currently reflected in the proposed budget, which affects reimbursement alignment for site execution.`

  const assessmentParagraph = headlineAsEmailProse(decision.headline)

  const top = topThreeActions(actions)
  let keyItemsBlock: string
  if (top.length === 0) {
    keyItemsBlock =
      "We recommend updating the proposed budget so that reimbursement aligns with protocol-required activity and documented site execution costs."
  } else {
    const lines = top.map(
      (a) =>
        `- ${a.activityName} (${a.visit}) — estimated gap $${formatGapDollars(a.impact)}`,
    )
    keyItemsBlock = `Key items for revision:\n${lines.join("\n")}`
  }

  const askParagraph =
    top.length === 0
      ? "We would be happy to review the budget together and finalize revised economics promptly."
      : "We recommend updating the budget to reflect these items so that reimbursement is aligned with protocol-required activity and site execution requirements. We would be happy to review these points together and finalize revised economics promptly."

  const closingLines = siteName?.trim()
    ? `Sincerely,\n${siteName.trim()}`
    : "Sincerely,\nSite Team"

  const body = [
    greetingLine,
    "",
    studyClause,
    "",
    assessmentParagraph,
    "",
    keyItemsBlock,
    "",
    askParagraph,
    "",
    closingLines,
  ].join("\n")

  return { subject, body }
}
