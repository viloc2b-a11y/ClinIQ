-- ClinIQ Financial — minimum portfolio + identity alignment.
--
-- Goal:
-- - Use existing real tables (imports, negotiation, execution, action center).
-- - Standardize on (site_id, study_key) as the product-facing identity for small sites.
-- - Keep the engine tables intact; bridge via existing fields + lightweight columns.

-- ---------------------------------------------------------------------------
-- Patch: add site_id + study_key to execution logs and expected billables
-- ---------------------------------------------------------------------------
alter table public.event_log
  add column if not exists site_id uuid references public.cliniq_sites(id) on delete set null;

alter table public.event_log
  add column if not exists study_key text;

-- Backfill: treat existing text study_id as study_key.
update public.event_log
set study_key = study_id
where (study_key is null or study_key = '')
  and study_id is not null
  and study_id <> '';

create index if not exists idx_event_log_site_study_key
  on public.event_log (site_id, study_key);

alter table public.expected_billables
  add column if not exists site_id uuid references public.cliniq_sites(id) on delete set null;

alter table public.expected_billables
  add column if not exists study_key text;

-- Backfill: treat existing text study_id as study_key.
update public.expected_billables
set study_key = study_id
where (study_key is null or study_key = '')
  and study_id is not null
  and study_id <> '';

create index if not exists idx_expected_billables_site_study_key
  on public.expected_billables (site_id, study_key);

-- ---------------------------------------------------------------------------
-- Views: portfolio rollup + expected-vs-actual summary
-- ---------------------------------------------------------------------------

-- Portfolio keyset: one row per (site_id, study_key) with basic phase signals.
create or replace view public.vw_portfolio_studies as
with keys as (
  select site_id, study_key, max(created_at) as last_seen_at
  from public.cliniq_import_sessions
  group by 1, 2

  union all
  select site_id, study_key, max(created_at) as last_seen_at
  from public.cliniq_budget_draft_versions
  group by 1, 2

  union all
  select site_id, study_key, max(created_at) as last_seen_at
  from public.negotiation_deals
  group by 1, 2

  union all
  select site_id, study_key, max(created_at) as last_seen_at
  from public.expected_billables
  where site_id is not null and study_key is not null and study_key <> ''
  group by 1, 2

  union all
  select bi.site_id, bi.execution_study_key as study_key, max(bi.created_at) as last_seen_at
  from public.billable_instances bi
  where bi.execution_study_key is not null and bi.execution_study_key <> ''
  group by 1, 2
),
dedup as (
  select site_id, study_key, max(last_seen_at) as last_seen_at
  from keys
  where site_id is not null and study_key is not null and study_key <> ''
  group by 1, 2
),
neg as (
  select site_id, study_key,
         max(created_at) filter (where status = 'open') as last_negotiation_at
  from public.negotiation_deals
  group by 1, 2
),
agreement as (
  select site_id, study_key,
         max(closed_at) as agreement_closed_at,
         max(total_sponsor) as total_sponsor,
         max(total_target) as total_target,
         max(upside) as upside
  from public.final_agreements
  group by 1, 2
)
select
  d.site_id,
  d.study_key,
  d.last_seen_at,
  a.agreement_closed_at,
  a.total_sponsor,
  a.total_target,
  a.upside,
  case
    when a.agreement_closed_at is not null then 'active'
    when n.last_negotiation_at is not null then 'negotiating'
    else 'draft'
  end as phase
from dedup d
left join neg n
  on n.site_id = d.site_id and n.study_key = d.study_key
left join agreement a
  on a.site_id = d.site_id and a.study_key = d.study_key;

-- Expected vs actual rollup by (site_id, study_key).
-- Bridges:
-- - expected_billables is keyed by study_key (text) + site_id (uuid)
-- - billable_instances joins via execution_study_key (text) + site_id (uuid)
create or replace view public.vw_study_expected_vs_actual as
select
  eb.site_id,
  eb.study_key,
  sum(eb.expected_revenue) as expected_revenue,
  sum(bi.amount) filter (where bi.status in ('invoiced', 'paid')) as billed_revenue,
  sum(bi.amount) filter (where bi.status = 'paid') as collected_revenue,
  greatest(
    coalesce(sum(eb.expected_revenue), 0)
    - coalesce(sum(bi.amount) filter (where bi.status in ('invoiced', 'paid')), 0),
    0
  ) as missing_revenue
from public.expected_billables eb
left join public.billable_instances bi
  on bi.site_id = eb.site_id
 and bi.execution_study_key = eb.study_key
where eb.site_id is not null
  and eb.study_key is not null
  and eb.study_key <> ''
group by 1, 2;

