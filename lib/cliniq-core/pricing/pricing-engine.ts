/**
 * Deterministic activity pricing from alias map + rate table + site cost profile (no AI).
 */

import { ACTIVITY_ALIASES } from "./activity-aliases"
import { RATE_TABLE, type RateTableEntry } from "./rate-table"

const BLENDED_TABLE_BASE_RATE =
  RATE_TABLE.length > 0
    ? RATE_TABLE.reduce((s, e) => s + e.baseRate, 0) / RATE_TABLE.length
    : 0

export type SiteCostProfile = {
  overheadMultiplier: number
  targetMarginPercent: number
  stretchMarginPercent: number
}

export type PricingInput = {
  activityName: string
  siteCostProfile: SiteCostProfile
}

export type PricingResult = {
  activityName: string
  matchedRateKey?: string
  category?: string
  baseRate: number
  floorPrice: number
  targetPrice: number
  stretchPrice: number
  justification: string
  isFallback: boolean
}

export function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

/** First alias hit in stable table order: normalized activity contains normalized alias (aliases shorter than 4 chars are ignored). */
export function resolveCanonicalKey(activityName: string): string | undefined {
  const normActivity = normalizeText(activityName)
  if (normActivity.length === 0) return undefined
  for (const group of ACTIVITY_ALIASES) {
    for (const alias of group.aliases) {
      const a = normalizeText(alias)
      if (a.length < 4) continue
      if (normActivity.includes(a)) return group.canonicalKey
    }
  }
  return undefined
}

function findRateByCanonicalKey(canonicalKey: string): RateTableEntry | undefined {
  const k = normalizeText(canonicalKey)
  for (const row of RATE_TABLE) {
    if (normalizeText(row.activityKey) === k) return row
  }
  return undefined
}

function findDirectTableMatch(normActivity: string): RateTableEntry | undefined {
  if (normActivity.length === 0) return undefined
  for (const entry of RATE_TABLE) {
    const key = normalizeText(entry.activityKey)
    if (key.length < 4) continue
    if (normActivity.includes(key)) return entry
  }
  return undefined
}

type MatchKind = "alias" | "direct" | "none"

function resolvePricingEntry(activityName: string): { entry?: RateTableEntry; kind: MatchKind } {
  const norm = normalizeText(activityName)
  if (norm.length === 0) return { kind: "none" }

  const canonical = resolveCanonicalKey(activityName)
  if (canonical !== undefined) {
    const byCanonical = findRateByCanonicalKey(canonical)
    if (byCanonical !== undefined) return { entry: byCanonical, kind: "alias" }
  }

  const direct = findDirectTableMatch(norm)
  if (direct !== undefined) return { entry: direct, kind: "direct" }

  return { kind: "none" }
}

export function priceActivity(input: PricingInput): PricingResult {
  const { activityName, siteCostProfile } = input
  const { overheadMultiplier, targetMarginPercent, stretchMarginPercent } = siteCostProfile

  const { entry, kind } = resolvePricingEntry(activityName)
  const matched = entry !== undefined
  const isFallback = !matched
  const baseRate = matched ? entry.baseRate : BLENDED_TABLE_BASE_RATE
  const category: RateTableEntry["category"] | undefined = matched ? entry.category : "other"
  const matchedRateKey = matched ? entry.activityKey : undefined

  const floorPrice = Math.round(baseRate * overheadMultiplier)
  const targetPrice = Math.round(floorPrice * (1 + targetMarginPercent))
  const stretchPrice = Math.round(floorPrice * (1 + stretchMarginPercent))

  let justification: string
  if (!matched) {
    justification = `${activityName} was not found in the rate table, so fallback pricing was applied using blended rate table average due to no direct match.`
  } else if (kind === "alias") {
    justification = `${activityName} was mapped to canonical activity '${matchedRateKey}' in category '${category}'. Pricing includes site overhead and target margin.`
  } else {
    justification = `${activityName} was matched to rate card entry '${matchedRateKey}' in category '${category}'. Pricing includes site overhead and target margin.`
  }

  return {
    activityName,
    matchedRateKey,
    category,
    baseRate,
    floorPrice,
    targetPrice,
    stretchPrice,
    justification,
    isFallback,
  }
}

/*
 * Example site cost profile (not executed):
 * {
 *   overheadMultiplier: 1.25,
 *   targetMarginPercent: 0.35,
 *   stretchMarginPercent: 0.6
 * }
 *
 * Resolution order (deterministic):
 * 1) ACTIVITY_ALIASES: activity text contains an alias string (alias length ≥ 4) → canonical key → RATE_TABLE row by exact key.
 * 2) Else substring match on rate activityKey (key length >= 4).
 * 3) Else blended average base rate (isFallback).
 */
