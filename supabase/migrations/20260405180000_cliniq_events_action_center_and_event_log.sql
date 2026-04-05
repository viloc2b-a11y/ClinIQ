-- ClinIQ — supplemental tables (events + Action Center adapters + simple event_log).
-- Safe alongside fee-template migrations (no overlap with site_fee_* / billable_instances engine).
-- Mutually exclusive reference schemas (do NOT apply on same DB as this stack):
--   - supabase/schema/cost_truth.sql (legacy role_costs / site_cost_profiles shape)
--   - supabase/schema/cliniq_core_v1.sql (alternate event_logs + billable_instances; conflicts with engine billables)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Simple execution event log (API ingestion)
-- ---------------------------------------------------------------------------
create table if not exists public.event_log (
  id uuid primary key default gen_random_uuid(),
  study_id text not null,
  subject_id text not null,
  visit_name text not null,
  event_type text not null,
  event_date timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_log_study_id on public.event_log (study_id);
create index if not exists idx_event_log_event_date on public.event_log (event_date);

-- ---------------------------------------------------------------------------
-- Python engine — append-only cliniq_events
-- ---------------------------------------------------------------------------
create table if not exists public.cliniq_events (
  id uuid primary key,
  event_type text not null,
  study_id text,
  subject_id text,
  visit_name text,
  event_timestamp timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cliniq_events_event_type
  on public.cliniq_events (event_type);

create index if not exists idx_cliniq_events_study_id
  on public.cliniq_events (study_id);

create index if not exists idx_cliniq_events_subject_id
  on public.cliniq_events (subject_id);

create index if not exists idx_cliniq_events_visit_name
  on public.cliniq_events (visit_name);

create index if not exists idx_cliniq_events_event_timestamp_desc
  on public.cliniq_events (event_timestamp desc);

-- ---------------------------------------------------------------------------
-- Action Center — split persistence stores (Supabase adapters)
-- ---------------------------------------------------------------------------
create table if not exists public.action_center_audit_log (
  id text not null,
  step text not null,
  timestamp timestamptz not null,
  primary key (id, step, timestamp)
);

create index if not exists idx_action_center_audit_log_timestamp
  on public.action_center_audit_log (timestamp asc);

create index if not exists idx_action_center_audit_log_id
  on public.action_center_audit_log (id);

create index if not exists idx_action_center_audit_log_step
  on public.action_center_audit_log (step);

create table if not exists public.action_center_metrics (
  key text primary key,
  writes_attempted integer not null default 0,
  writes_success integer not null default 0,
  writes_failed integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.action_center_operation_envelopes (
  operation_id text primary key,
  timestamp timestamptz not null,
  kind text not null,
  status text not null,
  summary jsonb not null
);

create index if not exists idx_action_center_operation_envelopes_timestamp
  on public.action_center_operation_envelopes (timestamp asc);

create index if not exists idx_action_center_operation_envelopes_kind
  on public.action_center_operation_envelopes (kind);

create index if not exists idx_action_center_operation_envelopes_status
  on public.action_center_operation_envelopes (status);

create table if not exists public.action_center_records (
  id text primary key,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_action_center_records_created_at
  on public.action_center_records (created_at desc);

-- ---------------------------------------------------------------------------
-- Action Center — ClinIQ domain model v1
-- ---------------------------------------------------------------------------
create table if not exists public.cliniq_action_items (
  id text primary key,
  study_id text not null,
  sponsor_id text,
  subject_id text not null,
  visit_name text not null,
  line_code text not null,

  action_type text not null,
  owner_role text not null,
  priority text not null,
  status text not null default 'open',

  title text not null,
  description text not null,

  expected_amount numeric(12,2) not null default 0,
  invoiced_amount numeric(12,2) not null default 0,
  missing_amount numeric(12,2) not null default 0,

  leakage_status text not null,
  leakage_reason text not null,

  event_log_id text,
  billable_instance_id text,
  invoice_period_start date,
  invoice_period_end date,

  source_hash text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_cliniq_action_items_study_id
  on public.cliniq_action_items (study_id);

create index if not exists idx_cliniq_action_items_subject_id
  on public.cliniq_action_items (subject_id);

create index if not exists idx_cliniq_action_items_status
  on public.cliniq_action_items (status);

create index if not exists idx_cliniq_action_items_priority
  on public.cliniq_action_items (priority);

create index if not exists idx_cliniq_action_items_owner_role
  on public.cliniq_action_items (owner_role);

create index if not exists idx_cliniq_action_items_action_type
  on public.cliniq_action_items (action_type);

create index if not exists idx_cliniq_action_items_missing_amount_desc
  on public.cliniq_action_items (missing_amount desc);

create index if not exists idx_cliniq_action_items_event_log_id
  on public.cliniq_action_items (event_log_id);

create index if not exists idx_cliniq_action_items_billable_instance_id
  on public.cliniq_action_items (billable_instance_id);

create index if not exists idx_cliniq_action_items_created_at_desc
  on public.cliniq_action_items (created_at desc);

create table if not exists public.cliniq_action_item_events (
  id uuid primary key default gen_random_uuid(),
  action_item_id text not null,
  event_type text not null,
  from_status text,
  to_status text,
  actor_type text not null default 'system',
  actor_id text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cliniq_action_item_events_action_item_id
  on public.cliniq_action_item_events (action_item_id);

create index if not exists idx_cliniq_action_item_events_event_type
  on public.cliniq_action_item_events (event_type);

create index if not exists idx_cliniq_action_item_events_created_at_desc
  on public.cliniq_action_item_events (created_at desc);

create table if not exists public.cliniq_action_center_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_key text not null,
  item_count integer not null default 0,
  total_open integer not null default 0,
  total_high_priority integer not null default 0,
  total_missing_amount numeric(12,2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cliniq_action_center_snapshots_snapshot_key
  on public.cliniq_action_center_snapshots (snapshot_key);

create index if not exists idx_cliniq_action_center_snapshots_created_at_desc
  on public.cliniq_action_center_snapshots (created_at desc);
