import type { NegotiationTarget } from "./negotiation-input"

export type NegotiationStrategyBucket = {
  mustFix: NegotiationTarget[]
  shouldImprove: NegotiationTarget[]
  ignore: NegotiationTarget[]
}

function byAbsGapDesc(a: NegotiationTarget, b: NegotiationTarget): number {
  return Math.abs(b.gapAmount) - Math.abs(a.gapAmount)
}

/**
 * Buckets targets for negotiation focus. Does not mutate the input array or its elements.
 */
export function buildNegotiationStrategy(
  targets: NegotiationTarget[],
): NegotiationStrategyBucket {
  const mustFix: NegotiationTarget[] = []
  const shouldImprove: NegotiationTarget[] = []
  const ignore: NegotiationTarget[] = []

  for (const t of targets) {
    if (t.kind === "missing") {
      mustFix.push(t)
      continue
    }
    if (t.kind === "loss") {
      const abs = Math.abs(t.gapAmount)
      if (abs >= 5000) mustFix.push(t)
      else if (abs >= 1000) shouldImprove.push(t)
      else ignore.push(t)
    }
  }

  mustFix.sort(byAbsGapDesc)
  shouldImprove.sort(byAbsGapDesc)
  ignore.sort(byAbsGapDesc)

  return { mustFix, shouldImprove, ignore }
}
