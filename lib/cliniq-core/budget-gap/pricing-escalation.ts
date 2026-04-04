import type { NegotiationTarget } from "./negotiation-input"

export type EscalatedNegotiationTarget = NegotiationTarget & {
  recommendedTotal: number
  increaseAmount: number
  escalationFactor: number
}

function normCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function hasPhrase(n: string, phrase: string): boolean {
  return n.includes(phrase)
}

/**
 * Category-based uplift on internal modeled totals (deterministic, phrase-friendly).
 */
export function getEscalationFactor(category: string): number {
  const n = normCategory(category)

  if (
    hasPhrase(n, "startup") ||
    hasPhrase(n, "start up") ||
    hasPhrase(n, "site activation")
  ) {
    return 1.3
  }
  if (hasPhrase(n, "screen failure") || hasPhrase(n, "screen fail")) {
    return 1.0
  }
  if (hasPhrase(n, "regulatory") || hasPhrase(n, "amendment")) {
    return 1.2
  }
  if (
    hasPhrase(n, "close out") ||
    hasPhrase(n, "closeout") ||
    hasPhrase(n, "close-out") ||
    hasPhrase(n, "archiving") ||
    hasPhrase(n, "archive")
  ) {
    return 1.2
  }
  if (
    hasPhrase(n, "pharmacy") ||
    /\bip\b/.test(n) ||
    hasPhrase(n, "accountability") ||
    hasPhrase(n, "investigational product")
  ) {
    return 1.2
  }
  if (
    hasPhrase(n, "lab") ||
    hasPhrase(n, "logistics") ||
    hasPhrase(n, "specimen") ||
    hasPhrase(n, "shipping") ||
    hasPhrase(n, "dry ice") ||
    hasPhrase(n, "courier")
  ) {
    return 1.25
  }

  return 1.15
}

export function applyEscalation(
  target: NegotiationTarget,
): EscalatedNegotiationTarget {
  const escalationFactor = getEscalationFactor(target.category)
  const recommendedTotal = Math.round(target.internalTotal * escalationFactor)
  const sponsorBase = target.sponsorTotalOffer
  const increaseAmount = Math.max(0, recommendedTotal - sponsorBase)
  return {
    ...target,
    recommendedTotal,
    increaseAmount,
    escalationFactor,
  }
}

export function applyEscalationToTargets(
  targets: NegotiationTarget[],
): EscalatedNegotiationTarget[] {
  return targets.map((t) => applyEscalation(t))
}
