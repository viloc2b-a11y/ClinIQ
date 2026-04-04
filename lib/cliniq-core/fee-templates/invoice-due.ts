/**
 * Invoice due date from occurrence date + max days (UTC calendar days, matches SQL cast pattern).
 */
export function computeInvoiceDueDateIso(
  occurredAtIso: string,
  maxDaysToInvoice: number,
): string {
  const base = occurredAtIso.slice(0, 10)
  const d = new Date(`${base}T12:00:00.000Z`)
  const days = Math.max(0, Math.floor(maxDaysToInvoice))
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
