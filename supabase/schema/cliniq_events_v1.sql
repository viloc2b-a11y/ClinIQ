-- ClinIQ Python engine — append-only event log (Supabase persistence target).
-- No RLS, no triggers in this file.

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
