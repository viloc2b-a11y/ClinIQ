export type ActionCenterVerificationResult = {
  totalExpected: number
  found: number
  missing: string[]
  matched: string[]
  warnings: string[]
}

export function buildActionCenterVerificationResult(input: {
  expectedIds: string[]
  foundIds: Iterable<string>
}): ActionCenterVerificationResult {
  const expectedIds = Array.isArray(input.expectedIds) ? input.expectedIds : []
  const foundSet = new Set(input.foundIds)

  const matched = expectedIds.filter((id) => foundSet.has(id))
  const missing = expectedIds.filter((id) => !foundSet.has(id))

  return {
    totalExpected: expectedIds.length,
    found: matched.length,
    missing,
    matched,
    warnings:
      missing.length > 0
        ? ["Some expected action items were not found in Action Center."]
        : [],
  }
}
