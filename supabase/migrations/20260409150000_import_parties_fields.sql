-- ClinIQ — minimal parties fields for site-facing dashboard.
-- Adds sponsor/cro labels to intake objects (no new tables).

alter table public.cliniq_import_sessions
  add column if not exists sponsor_name text,
  add column if not exists cro_name text;

alter table public.cliniq_budget_draft_versions
  add column if not exists sponsor_name text,
  add column if not exists cro_name text;

-- Latest known parties per (site_id, study_key) from intake/drafts.
create or replace view public.vw_study_parties as
with sessions as (
  select
    site_id,
    btrim(study_key) as study_key,
    sponsor_name,
    cro_name,
    created_at
  from public.cliniq_import_sessions
  where site_id is not null and study_key is not null and btrim(study_key) <> ''
),
drafts as (
  select
    site_id,
    btrim(study_key) as study_key,
    sponsor_name,
    cro_name,
    created_at
  from public.cliniq_budget_draft_versions
  where site_id is not null and study_key is not null and btrim(study_key) <> ''
),
unioned as (
  select * from sessions
  union all
  select * from drafts
),
ranked as (
  select
    site_id,
    study_key,
    sponsor_name,
    cro_name,
    row_number() over (partition by site_id, study_key order by created_at desc) as rn
  from unioned
)
select
  site_id,
  study_key,
  sponsor_name,
  cro_name
from ranked
where rn = 1;

