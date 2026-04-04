/**
 * Normalize raw sponsor offer payloads into `Partial<Record<FeeFamily, number | null>>` for Module 2.
 */

import type { FeeFamily } from "../cost-model/cost-model-types"

const FEE_FAMILIES = [
  "startup",
  "screening_visit",
  "randomization_visit",
  "followup_visit",
  "screen_failure",
  "pharmacy",
  "imaging",
  "lab_local",
  "lab_central",
  "shipping",
  "retention",
  "closeout",
] as const satisfies readonly FeeFamily[]

const FEE_FAMILY_SET = new Set<string>(FEE_FAMILIES)

/**
 * Explicit aliases only (no fuzzy guessing). Lookup uses lowercase for this map after exact FeeFamily match fails.
 */
const ALIAS_TO_FAMILY: Record<string, FeeFamily> = {
  startup_fee: "startup",
  screening: "screening_visit",
  randomization: "randomization_visit",
  follow_up: "followup_visit",
  followup: "followup_visit",
  local_lab: "lab_local",
  central_lab: "lab_central",
}

export interface RawSponsorOfferRow {
  key: string
  amount: number | null | undefined
}

export interface NormalizeSponsorOfferResult {
  offers: Partial<Record<FeeFamily, number | null>>
  warnings: string[]
  unmatched: Array<{
    rawKey: string
    amount: number | null
  }>
}

function resolveFamily(rawKeyTrimmed: string): FeeFamily | null {
  if (!rawKeyTrimmed) return null
  if (FEE_FAMILY_SET.has(rawKeyTrimmed)) {
    return rawKeyTrimmed as FeeFamily
  }
  const lower = rawKeyTrimmed.toLowerCase()
  if (FEE_FAMILY_SET.has(lower)) {
    return lower as FeeFamily
  }
  return ALIAS_TO_FAMILY[rawKeyTrimmed] ?? ALIAS_TO_FAMILY[lower] ?? null
}

function normalizeAmount(
  amount: number | null | undefined,
  contextKey: string,
  warnings: string[],
): number | null {
  if (amount === undefined || amount === null) return null
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    warnings.push(
      `Non-finite amount for key "${contextKey}"; treated as null.`,
    )
    return null
  }
  return amount
}

function mergeEntries(
  entries: ReadonlyArray<{ rawKey: string; amount: number | null | undefined }>,
  trackDuplicateRowKeys: boolean,
): NormalizeSponsorOfferResult {
  const offers: Partial<Record<FeeFamily, number | null>> = {}
  const warnings: string[] = []
  const unmatched: Array<{ rawKey: string; amount: number | null }> = []
  const seenRowKeys = new Set<string>()

  for (const { rawKey, amount } of entries) {
    const trimmedKey = rawKey.trim()
    const contextKey = trimmedKey || rawKey || "(empty key)"

    if (trackDuplicateRowKeys && trimmedKey !== "" && seenRowKeys.has(trimmedKey)) {
      warnings.push(`Duplicate row key "${trimmedKey}": last value wins.`)
    }

    const normalizedAmount = normalizeAmount(amount, contextKey, warnings)
    const family = resolveFamily(trimmedKey)

    if (family === null) {
      if (trimmedKey !== "") {
        warnings.push(
          `Unknown fee key "${rawKey.trim() || rawKey}": no FeeFamily match.`,
        )
      } else {
        warnings.push("Empty key: ignored.")
      }
      unmatched.push({
        rawKey,
        amount: normalizedAmount,
      })
    } else {
      offers[family] = normalizedAmount
    }

    if (trackDuplicateRowKeys && trimmedKey !== "") {
      seenRowKeys.add(trimmedKey)
    }
  }

  return { offers, warnings, unmatched }
}

export function normalizeSponsorOfferRecord(
  input: Record<string, number | null | undefined>,
): NormalizeSponsorOfferResult {
  const entries = Object.entries(input).map(([rawKey, amount]) => ({
    rawKey,
    amount,
  }))
  return mergeEntries(entries, false)
}

export function normalizeSponsorOfferRows(
  input: RawSponsorOfferRow[],
): NormalizeSponsorOfferResult {
  return mergeEntries(
    input.map((row) => ({ rawKey: row.key, amount: row.amount })),
    true,
  )
}
