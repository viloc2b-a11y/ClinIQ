/**
 * ClinIQ Fee Template Engine v1 — TypeScript shapes aligned with build spec / Postgres.
 */

import type { DefaultRateStrategy, FeeEngineBehavior } from "./fee-taxonomy"

export type BillableInstanceStatus =
  | "expected"
  | "earned"
  | "invoiceable"
  | "invoiced"
  | "paid"
  | "disputed"

export type SiteFeeTemplateRow = {
  id: string
  site_id: string
  name: string
  description: string | null
  therapeutic_area: string | null
  sponsor_scope: string | null
  is_default: boolean
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
}

export type SiteFeeTemplateItemRow = {
  id: string
  template_id: string
  fee_code: string
  fee_name: string
  category: string
  unit: string
  default_rate: number | null
  range_low: number | null
  range_high: number | null
  percent_rate: number | null
  trigger_name: string
  trigger_type: string
  trigger_source: string
  billing_cycle: string
  payment_terms: string
  priority: string
  sponsor_visible: boolean
  auto_create_billable: boolean
  invoice_required: boolean
  max_days_to_invoice: number | null
  justification_template: string | null
  is_active: boolean
  engine_behavior: FeeEngineBehavior
  default_rate_strategy: DefaultRateStrategy | null
  created_at: string
  updated_at: string
}

/** Parsed from study_fee_templates.template_snapshot_json */
export type StudyFeeTemplateSnapshot = {
  version: number
  template: {
    id: string
    name: string
  }
  items: StudyFeeTemplateSnapshotItem[]
}

export type StudyFeeTemplateSnapshotItem = {
  id: string
  fee_code: string
  fee_name?: string
  default_rate: number | null
  max_days_to_invoice?: number
  auto_create_billable?: boolean
  invoice_required?: boolean
}

export type StudyFeeTemplateRow = {
  id: string
  study_id: string
  site_id: string
  template_id: string
  template_snapshot_json: StudyFeeTemplateSnapshot
  created_at: string
}

/** UUID used when subject_id IS NULL for operational dedupe (generated `subject_dedupe`). */
export const BILLABLE_SUBJECT_DEDUPE_NIL =
  "00000000-0000-0000-0000-000000000000" as const

export type BillableInstanceRow = {
  id: string
  study_id: string
  site_id: string
  subject_id: string | null
  subject_dedupe?: string
  visit_id: string | null
  fee_code: string
  template_item_id: string | null
  source_event_id: string
  source_event_type: string
  amount: number
  quantity: number
  status: BillableInstanceStatus
  document_complete: boolean
  invoice_required: boolean
  invoice_due_date: string | null
  earned_at: string | null
  invoiceable_at: string | null
  invoiced_at: string | null
  paid_at: string | null
  disputed_at: string | null
  notes: string | null
  metadata_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type InvoicePackageRow = {
  id: string
  study_id: string
  site_id: string
  sponsor_id: string | null
  invoice_period_start: string
  invoice_period_end: string
  status: string
  total_amount: number
  created_at: string
  updated_at: string
}

export type InvoicePackageItemRow = {
  id: string
  invoice_package_id: string
  billable_instance_id: string
  amount: number
  created_at: string
}

/** RPC — parameter names match Postgres function create_billable_from_event */
export type CreateBillableFromEventRpcParams = {
  p_event_type: string
  p_event_id: string
  p_study_id: string
  p_site_id: string
  p_subject_id: string | null
  p_visit_id: string | null
  p_occurred_at?: string
}
