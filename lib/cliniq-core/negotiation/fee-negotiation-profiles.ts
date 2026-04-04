/**
 * Fee-level negotiation classes for ClinIQ starter template (~30 fee codes).
 * Unknown codes default to defend / 12% max discount.
 */

export type NegotiationClass = "must_win" | "defend" | "tradeable"

export type FeeNegotiationProfile = {
  fee_code: string
  negotiation_class: NegotiationClass
  max_discount_pct: number
}

const DEFAULT_CORE = {
  negotiation_class: "defend" as NegotiationClass,
  max_discount_pct: 12,
}

function row(
  fee_code: string,
  negotiation_class: NegotiationClass,
  max_discount_pct: number,
): FeeNegotiationProfile {
  return { fee_code, negotiation_class, max_discount_pct }
}

/** Explicit entries for all starter-template fee codes; default applies to any omitted key. */
const PROFILE_ROWS: FeeNegotiationProfile[] = [
  // Must win
  row("SF-START-001", "must_win", 0),
  row("INV-SF-001", "must_win", 0),
  row("INV-ARC-001", "must_win", 0),
  row("INV-CLO-001", "must_win", 0),
  row("SF-IRB-001", "must_win", 0),
  /** Alias for IRB initial (spec code); same class as SF-IRB-001 */
  row("IRB-INIT-001", "must_win", 0),
  // Defend (named examples + remainder of 30)
  row("PP-SCR-001", "defend", 12),
  row("PP-FUP-001", "defend", 12),
  row("PP-RAND-001", "defend", 12),
  row("INV-AMD-001", "defend", 12),
  row("INV-PHARM-001", "defend", 12),
  row("INV-SAE-001", "defend", 12),
  row("SF-PHARM-001", "defend", 12),
  row("SF-SIV-001", "defend", 12),
  row("SF-REG-001", "defend", 12),
  row("PP-EOS-001", "defend", 12),
  row("INV-QUERY-001", "defend", 12),
  row("ADMIN-OVER-001", "defend", 12),
  row("ADMIN-IRB-001", "defend", 12),
  row("ADMIN-TECH-001", "defend", 12),
  row("CONT-BUF-001", "defend", 12),
  row("PASS-LAB-001", "defend", 12),
  row("PASS-TRAV-001", "defend", 12),
  row("INV-IMAG-001", "defend", 12),
  row("INV-DEV-001", "defend", 12),
  row("INF-ADJ-001", "defend", 12),
  // Tradeable (spec: INV-UNS / INV-REC → starter PP-UNS / RECR-ADV)
  row("INV-DRY-001", "tradeable", 12),
  row("INV-CONC-001", "tradeable", 12),
  row("INV-MON-001", "tradeable", 12),
  row("PP-UNS-001", "tradeable", 12),
  row("RECR-ADV-001", "tradeable", 12),
]

export const FEE_NEGOTIATION_PROFILES = new Map<string, FeeNegotiationProfile>(
  PROFILE_ROWS.map((p) => [p.fee_code, p]),
)

export function getFeeNegotiationProfile(feeCode: string): FeeNegotiationProfile {
  const hit = FEE_NEGOTIATION_PROFILES.get(feeCode)
  if (hit) return { ...hit, fee_code: feeCode }
  return {
    fee_code: feeCode,
    negotiation_class: DEFAULT_CORE.negotiation_class,
    max_discount_pct: DEFAULT_CORE.max_discount_pct,
  }
}

export function isMustWinFee(feeCode: string): boolean {
  return getFeeNegotiationProfile(feeCode).negotiation_class === "must_win"
}

/** @deprecated use NegotiationClass */
export type FeeNegotiationClass = NegotiationClass
