export function verifyActionSeedPersistence(params: {
  expectedIds: string[]
  verificationResult: {
    found?: number
    missing?: string[]
    matched?: string[]
    totalExpected?: number
  } | null
}) {
  if (!params.verificationResult) {
    return {
      data: {
        verified: false,
      },
      summary: {
        verified: false,
      },
      warnings: [
        {
          code: "missing_verification_result",
          message: "No verification result was returned",
          severity: "error" as const,
        },
      ],
    }
  }

  const missing = Array.isArray(params.verificationResult.missing)
    ? params.verificationResult.missing
    : []

  const verified = missing.length === 0

  return {
    data: {
      verified,
    },
    summary: {
      verified,
    },
    warnings: verified
      ? []
      : [
          {
            code: "action_seed_verification_failed",
            message: `Some persisted action seeds were not verified (${missing.length}/${params.expectedIds.length})`,
            severity: "error" as const,
          },
        ],
  }
}
