-- ClinIQ core v1 — pricing, fee templates, execution traceability
-- Schema only: no RLS, no seed data, no updated_at triggers (columns present for future use).
--
-- Conflict note: this file uses public.site_cost_profiles, public.role_costs, public.billable_instances.
-- If you already applied supabase/schema/cost_truth.sql or fee-template migrations that created
-- those names with different shapes, resolve (rename legacy tables, new DB, or ALTER) before applying.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) Site cost profiles
-- ---------------------------------------------------------------------------
create table if not exists public.site_cost_profiles (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  name text not null,
  overhead_percent numeric(6, 4) not null
    check (overhead_percent >= 0 and overhead_percent <= 1),
  margin_target numeric(6, 4) not null
    check (margin_target >= 0 and margin_target <= 1),
  nnn_monthly numeric(12, 2),
  market text,
  site_type text,
  calibration_year text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_cost_profiles_site_id
  on public.site_cost_profiles (site_id);

create index if not exists idx_site_cost_profiles_is_active
  on public.site_cost_profiles (is_active);

-- ---------------------------------------------------------------------------
-- 2) Role costs (HBR / role rates per profile)
-- ---------------------------------------------------------------------------
create table if not exists public.role_costs (
  id uuid primary key default gen_random_uuid(),
  site_cost_profile_id uuid not null
    references public.site_cost_profiles (id) on delete cascade,
  role_code text not null,
  hourly_cost numeric(12, 2) not null check (hourly_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_cost_profile_id, role_code)
);

create index if not exists idx_role_costs_site_cost_profile_id
  on public.role_costs (site_cost_profile_id);

-- ---------------------------------------------------------------------------
-- 3) Site fee template packs (metadata)
-- ---------------------------------------------------------------------------
create table if not exists public.site_fee_templates (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  version integer not null,
  market text,
  calibration_year text,
  currency text not null default 'USD',
  site_type text,
  default_overhead_rate numeric(6, 4)
    check (default_overhead_rate >= 0 and default_overhead_rate <= 1),
  default_margin_target numeric(6, 4)
    check (default_margin_target >= 0 and default_margin_target <= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, version)
);

create index if not exists idx_site_fee_templates_site_id
  on public.site_fee_templates (site_id);

create index if not exists idx_site_fee_templates_is_active
  on public.site_fee_templates (is_active);

-- ---------------------------------------------------------------------------
-- 4) Fee rows within a template pack
-- ---------------------------------------------------------------------------
create table if not exists public.site_fee_template_items (
  id uuid primary key default gen_random_uuid(),
  site_fee_template_id uuid not null
    references public.site_fee_templates (id) on delete cascade,
  fee_code text not null,
  fee_name text not null,
  category text not null,
  unit text not null,
  "trigger" text not null,
  billing text not null,
  payment_terms text,
  priority text,
  negotiation_category text,
  min_acceptable_percent numeric(6, 4)
    check (min_acceptable_percent >= 0 and min_acceptable_percent <= 1),
  max_concession numeric(6, 4)
    check (max_concession >= 0 and max_concession <= 1),
  pricing_low numeric(12, 2),
  pricing_mid numeric(12, 2),
  pricing_high numeric(12, 2),
  pricing_recommended numeric(12, 2),
  markup_on_cost numeric(6, 4),
  payment_strategy text,
  justification_template text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_fee_template_id, fee_code)
);

create index if not exists idx_site_fee_template_items_template_id
  on public.site_fee_template_items (site_fee_template_id);

create index if not exists idx_site_fee_template_items_fee_code
  on public.site_fee_template_items (fee_code);

create index if not exists idx_site_fee_template_items_category
  on public.site_fee_template_items (category);

create index if not exists idx_site_fee_template_items_negotiation_category
  on public.site_fee_template_items (negotiation_category);

-- ---------------------------------------------------------------------------
-- 5) Therapeutic-area adjusted prices per fee item
-- ---------------------------------------------------------------------------
create table if not exists public.site_fee_complexity_prices (
  id uuid primary key default gen_random_uuid(),
  site_fee_template_item_id uuid not null
    references public.site_fee_template_items (id) on delete cascade,
  therapeutic_area text not null,
  adjusted_price numeric(12, 2) not null check (adjusted_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_fee_template_item_id, therapeutic_area)
);

create index if not exists idx_site_fee_complexity_prices_item_id
  on public.site_fee_complexity_prices (site_fee_template_item_id);

create index if not exists idx_site_fee_complexity_prices_therapeutic_area
  on public.site_fee_complexity_prices (therapeutic_area);

-- ---------------------------------------------------------------------------
-- 6) Event logs (study execution ingestion)
-- ---------------------------------------------------------------------------
create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  study_id text not null,
  sponsor_id text,
  subject_id text,
  visit_name text,
  event_type text not null,
  line_code text not null,
  quantity numeric(12, 2) not null default 1 check (quantity >= 0),
  occurred_at timestamptz not null,
  source text,
  status text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_logs_site_id
  on public.event_logs (site_id);

create index if not exists idx_event_logs_study_id
  on public.event_logs (study_id);

create index if not exists idx_event_logs_sponsor_id
  on public.event_logs (sponsor_id);

create index if not exists idx_event_logs_subject_id
  on public.event_logs (subject_id);

create index if not exists idx_event_logs_line_code
  on public.event_logs (line_code);

create index if not exists idx_event_logs_occurred_at
  on public.event_logs (occurred_at);

-- ---------------------------------------------------------------------------
-- 7) Billable instances (derived from events)
-- ---------------------------------------------------------------------------
create table if not exists public.billable_instances (
  id uuid primary key default gen_random_uuid(),
  event_log_id uuid not null
    references public.event_logs (id) on delete cascade,
  study_id text not null,
  sponsor_id text,
  subject_id text,
  visit_name text,
  fee_code text,
  line_code text not null,
  label text not null,
  category text,
  quantity numeric(12, 2) not null default 1 check (quantity >= 0),
  unit_amount numeric(12, 2) not null check (unit_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  occurred_at timestamptz not null,
  pricing_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billable_instances_event_log_id
  on public.billable_instances (event_log_id);

create index if not exists idx_billable_instances_study_id
  on public.billable_instances (study_id);

create index if not exists idx_billable_instances_sponsor_id
  on public.billable_instances (sponsor_id);

create index if not exists idx_billable_instances_subject_id
  on public.billable_instances (subject_id);

create index if not exists idx_billable_instances_fee_code
  on public.billable_instances (fee_code);

create index if not exists idx_billable_instances_line_code
  on public.billable_instances (line_code);

create index if not exists idx_billable_instances_occurred_at
  on public.billable_instances (occurred_at);

-- ---------------------------------------------------------------------------
-- 8) Claims ledger rows (bridge to claims / invoice)
-- ---------------------------------------------------------------------------
create table if not exists public.claims_ledger_rows (
  id uuid primary key default gen_random_uuid(),
  billable_instance_id uuid not null
    references public.billable_instances (id) on delete cascade,
  event_log_id uuid references public.event_logs (id) on delete set null,
  study_id text not null,
  sponsor_id text,
  subject_id text,
  visit_name text,
  event_date timestamptz not null,
  fee_code text,
  line_code text not null,
  label text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  status text,
  approved boolean not null default false,
  support_documentation_complete boolean not null default false,
  invoice_period_start date,
  invoice_period_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_claims_ledger_rows_billable_instance_id
  on public.claims_ledger_rows (billable_instance_id);

create index if not exists idx_claims_ledger_rows_event_log_id
  on public.claims_ledger_rows (event_log_id);

create index if not exists idx_claims_ledger_rows_study_id
  on public.claims_ledger_rows (study_id);

create index if not exists idx_claims_ledger_rows_sponsor_id
  on public.claims_ledger_rows (sponsor_id);

create index if not exists idx_claims_ledger_rows_subject_id
  on public.claims_ledger_rows (subject_id);

create index if not exists idx_claims_ledger_rows_fee_code
  on public.claims_ledger_rows (fee_code);

create index if not exists idx_claims_ledger_rows_line_code
  on public.claims_ledger_rows (line_code);

create index if not exists idx_claims_ledger_rows_event_date
  on public.claims_ledger_rows (event_date);

create index if not exists idx_claims_ledger_rows_invoice_period_start
  on public.claims_ledger_rows (invoice_period_start);

create index if not exists idx_claims_ledger_rows_invoice_period_end
  on public.claims_ledger_rows (invoice_period_end);
