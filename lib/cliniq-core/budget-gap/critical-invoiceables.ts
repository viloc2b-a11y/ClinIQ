/**
 * Categories that must appear on the sponsor budget; absence → missing revenue risk.
 * Matching is done on normalized category text (see normalize.ts).
 */
export const CRITICAL_INVOICEABLE_CATEGORY_PATTERNS: readonly string[] = [
  "startup",
  "screen failure",
  "close",
  "closeout",
  "close out",
  "archiv",
  "dry ice",
  "shipping",
  "lab handling",
  "specimen",
  "pharmacy",
  "ip handling",
  "investigational product",
  "concierge",
  "follow up admin",
  "follow-up admin",
  "patient concierge",
  "regulatory amendment",
  "amendment review",
]

export function isCriticalInvoiceableCategory(category: string): boolean {
  const c = category.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  if (!c) return false
  return CRITICAL_INVOICEABLE_CATEGORY_PATTERNS.some((p) => c.includes(p))
}
