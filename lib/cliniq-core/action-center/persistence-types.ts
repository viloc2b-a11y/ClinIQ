export interface ActionItemRow {
  id: string
  study_id: string
  sponsor_id: string | null
  subject_id: string
  visit_name: string
  line_code: string

  action_type: string
  owner_role: string
  priority: string
  status: string

  title: string
  description: string

  expected_amount: number
  invoiced_amount: number
  missing_amount: number

  leakage_status: string
  leakage_reason: string

  event_log_id: string | null
  billable_instance_id: string | null
  invoice_period_start: string | null
  invoice_period_end: string | null

  source_hash: string | null
  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface ActionItemEventRow {
  id: string
  action_item_id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  actor_type: string
  actor_id: string | null
  note: string | null
  payload: Record<string, unknown>
  created_at: string
}
