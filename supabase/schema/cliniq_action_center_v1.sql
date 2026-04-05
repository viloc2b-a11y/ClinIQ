-- ClinIQ Action Center persistence model v1
-- Supabase-ready, but safe to keep local until connection is enabled.
-- No RLS, no triggers, no foreign keys to external tables yet.

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
