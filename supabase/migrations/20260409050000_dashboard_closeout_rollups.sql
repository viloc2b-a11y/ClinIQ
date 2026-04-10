-- ClinIQ Financial — dashboard + closeout rollups.
--
-- Adds minimal views to power the site-level command center.
-- No new core tables; uses existing engine + negotiation + intake tables.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Closeout rollup (per site_id + study_key)
-- ---------------------------------------------------------------------------
create or replace view public.vw_study_closeout_rollup as
select
  bi.site_id,
  bi.execution_study_key as study_key,
  sum(bi.amount) filter (where bi.status in ('earned','invoiceable')) as unbilled_amount,
  sum(bi.amount) filter (where bi.status = 'invoiced') as uncollected_amount,
  count(*) filter (where bi.status in ('earned','invoiceable','invoiced','disputed')) as open_billables_count,
  count(distinct ipi.invoice_package_id) as open_invoice_packages_count,
  count(*) as total_billables_count,
  case
    when count(*) = 0 then 1.0
    else 1.0 - (
      (count(*) filter (where bi.status in ('earned','invoiceable','invoiced','disputed')))::numeric
      / (count(*))::numeric
    )
  end as readiness_pct
from public.billable_instances bi
left join public.invoice_package_items ipi
  on ipi.billable_instance_id = bi.id
where bi.execution_study_key is not null and bi.execution_study_key <> ''
group by 1, 2;

-- ---------------------------------------------------------------------------
-- Portfolio phase v2 (draft/negotiating/active/closeout)
-- ---------------------------------------------------------------------------
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
),
closeout as (
  select site_id, study_key,
         coalesce(unbilled_amount, 0) as unbilled_amount,
         coalesce(uncollected_amount, 0) as uncollected_amount,
         coalesce(open_billables_count, 0) as open_billables_count,
         coalesce(open_invoice_packages_count, 0) as open_invoice_packages_count,
         coalesce(readiness_pct, 1.0) as readiness_pct
  from public.vw_study_closeout_rollup
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
    when a.agreement_closed_at is not null
      and (
        coalesce(c.unbilled_amount, 0) > 0
        or coalesce(c.uncollected_amount, 0) > 0
        or coalesce(c.open_invoice_packages_count, 0) > 0
        or coalesce(c.open_billables_count, 0) > 0
      )
      then 'closeout'
    when a.agreement_closed_at is not null then 'active'
    when n.last_negotiation_at is not null then 'negotiating'
    else 'draft'
  end as phase
from dedup d
left join neg n
  on n.site_id = d.site_id and n.study_key = d.study_key
left join agreement a
  on a.site_id = d.site_id and a.study_key = d.study_key
left join closeout c
  on c.site_id = d.site_id and c.study_key = d.study_key;

-- ---------------------------------------------------------------------------
-- Dashboard-ready combined rows
-- ---------------------------------------------------------------------------
create or replace view public.vw_dashboard_portfolio_rows as
select
  p.site_id,
  p.study_key,
  p.phase,
  p.agreement_closed_at,
  p.total_sponsor,
  p.total_target,
  p.upside,
  coalesce(e.expected_revenue, 0) as expected_revenue,
  coalesce(e.billed_revenue, 0) as billed_revenue,
  coalesce(e.collected_revenue, 0) as collected_revenue,
  coalesce(e.missing_revenue, 0) as at_risk_revenue,
  coalesce(c.unbilled_amount, 0) as closeout_unbilled,
  coalesce(c.uncollected_amount, 0) as closeout_uncollected,
  coalesce(c.open_invoice_packages_count, 0) as closeout_open_packages,
  coalesce(c.readiness_pct, 1.0) as closeout_readiness_pct
from public.vw_portfolio_studies p
left join public.vw_study_expected_vs_actual e
  on e.site_id = p.site_id and e.study_key = p.study_key
left join public.vw_study_closeout_rollup c
  on c.site_id = p.site_id and c.study_key = p.study_key;

