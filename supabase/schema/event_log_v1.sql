-- ClinIQ v1 — append-only execution events for API ingestion (no RLS in this file).
create extension if not exists "pgcrypto";

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
