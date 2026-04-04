/**
 * Clinical event type → fee_code (v1 triggers only).
 * Template rows use a separate dimension (`trigger_type` = contract | visit | screen_failure | amendment).
 * Keep aligned with `public.map_clinical_event_to_fee_code` in migration
 * `20260403190000_fee_template_engine_v1.sql`.
 */
export const EVENT_TO_FEE_CODE: Readonly<Record<string, string>> = {
  cta_fully_executed: "SF-START-001",
  screening_visit_completed: "PP-SCR-001",
  followup_visit_completed: "PP-FUP-001",
  screen_failure_confirmed: "INV-SF-001",
  amendment_approved: "INV-AMD-001",
} as const

export type MappedClinicalEventType = keyof typeof EVENT_TO_FEE_CODE

/**
 * Maps event type to fee code (case-insensitive, trimmed). Unknown → null.
 */
export function mapClinicalEventTypeToFeeCode(eventType: string): string | null {
  const key = eventType.trim().toLowerCase()
  return EVENT_TO_FEE_CODE[key] ?? null
}
