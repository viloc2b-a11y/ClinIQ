-- Execution core: SoA-aligned expected rows + join key for billable_instances vs text study ids.

create table if not exists public.expected_billables (
  id uuid primary key default gen_random_uuid(),
  study_id text not null,
  budget_line_id text not null default '',
  line_code text not null,
  label text not null,
  category text not null default '',
  visit_name text not null,
  unit text not null default 'flat',
  expected_quantity numeric(12, 4) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  expected_revenue numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expected_billables_study_id
  on public.expected_billables (study_id);

create index if not exists idx_expected_billables_line_code
  on public.expected_billables (study_id, line_code);

create or replace trigger expected_billables_set_updated_at
  before update on public.expected_billables
  for each row execute function public.set_updated_at();

create or replace view public.visit_log as
select
  id,
  study_id,
  subject_id,
  visit_name,
  event_type,
  event_date,
  created_at
from public.event_log;

alter table public.billable_instances
  add column if not exists execution_study_key text;

create index if not exists billable_instances_execution_study_key_idx
  on public.billable_instances (execution_study_key)
  where execution_study_key is not null;
