export type NegotiationItemLike = {
  current_price: number
  internal_cost: number
  proposed_price: number
  status: "pending" | "accepted" | "rejected"
}

export function stableNegotiationLineKey(input: {
  lineCode: string
  category: string
  visitName: string
  label: string
  unit: string
}): string {
  // Deterministic, versionable key. We use a plain normalized string here so:
  // - client and server can compute the same value without crypto dependencies
  // - DB can optionally hash it for indexing if needed later
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ")
  return [
    "v1",
    norm(input.lineCode),
    norm(input.category),
    norm(input.visitName),
    norm(input.label),
    norm(input.unit),
  ].join("|")
}

export type NegotiationFinancialSummary = {
  total_sponsor: number
  total_internal: number
  total_target: number
  upside: number
  margin: number
}

const EPS = 1e-9

export function computeNegotiationFinancialSummary(
  items: NegotiationItemLike[],
): NegotiationFinancialSummary {
  let totalSponsor = 0
  let totalInternal = 0
  let totalTarget = 0

  for (const it of items) {
    const cur = Number.isFinite(it.current_price) ? it.current_price : 0
    const internal = Number.isFinite(it.internal_cost) ? it.internal_cost : 0
    const proposed = Number.isFinite(it.proposed_price) ? it.proposed_price : 0
    totalSponsor += cur
    totalInternal += internal
    totalTarget += it.status === "rejected" ? cur : proposed
  }

  const upside = totalTarget - totalSponsor
  const margin = (totalTarget - totalInternal) / Math.max(totalInternal, EPS)

  return {
    total_sponsor: totalSponsor,
    total_internal: totalInternal,
    total_target: totalTarget,
    upside,
    margin,
  }
}

