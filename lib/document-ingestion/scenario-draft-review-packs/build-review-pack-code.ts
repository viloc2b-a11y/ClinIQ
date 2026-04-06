function normalizeToken(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalized || "unknown"
}

export function buildReviewPackCode(args: {
  familyKey: string | null
  structureIntent:
    | "edge_case_expansion"
    | "family_depth_expansion"
    | "distribution_rebalance"
}): string {
  const familyToken = normalizeToken(args.familyKey ?? "unassigned")
  const intentToken = normalizeToken(args.structureIntent)

  return `REVIEW_PACK_${familyToken}_${intentToken}`.toUpperCase()
}
