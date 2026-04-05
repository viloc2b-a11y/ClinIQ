import { buildInvoicePackage } from "../claims/build-claims"
import type { ClaimItem, InvoicePackage } from "../claims/types"

export type BuildInvoicePackagesInput = {
  claimItems: ClaimItem[]
  generatedAt?: string
}

export type InvoicePackagesResult = {
  data: InvoicePackage[]
  summary: {
    totalPackages: number
    totalAmount: number
  }
  warnings: string[]
}

/**
 * STEP 81 — Invoice packages from claim items. Only **invoice-ready** lines (status `ready` and
 * {@link isInvoiceReadyClaimItem} rules) are included; see {@link buildInvoicePackage}.
 */
export function buildInvoicePackagesFromClaims(
  input: BuildInvoicePackagesInput,
): InvoicePackagesResult {
  const warnings: string[] = []
  if (input.claimItems.length === 0) {
    warnings.push("No claim items provided.")
  }

  const data = buildInvoicePackage({
    claimItems: input.claimItems,
    generatedAt: input.generatedAt,
  })

  const blocking = data.filter((p) => p.hasBlockingIssues)
  if (blocking.length > 0) {
    warnings.push(
      `${blocking.length} package(s) have blocking issues; lines are invoice-ready only.`,
    )
  }

  const totalAmount = data.reduce((s, p) => s + p.subtotal, 0)

  return {
    data,
    summary: {
      totalPackages: data.length,
      totalAmount,
    },
    warnings,
  }
}
