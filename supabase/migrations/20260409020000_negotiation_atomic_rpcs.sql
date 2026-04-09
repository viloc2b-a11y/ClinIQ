-- ClinIQ — Atomic negotiation write paths via RPC (transactional).
-- Covers:
-- - save_negotiation_items_atomic
-- - close_negotiation_deal_atomic

-- NOTE: These functions run with SECURITY INVOKER semantics by default.
-- They rely on existing RLS policies on negotiation_* tables.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- save_negotiation_items_atomic
-- ---------------------------------------------------------------------------
create or replace function public.save_negotiation_items_atomic(
  p_deal_id uuid,
  p_expected_version int,
  p_site_id uuid,
  p_study_key text,
  p_study_name text,
  p_items jsonb
)
returns table (
  version int,
  last_updated_at timestamptz,
  last_updated_by uuid
)
language plpgsql
as $$
declare
  v_deal record;
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_financials jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'unauthorized';
  end if;
  if p_deal_id is null then
    raise exception using errcode = 'P0001', message = 'invalid_input:deal_id';
  end if;
  if p_expected_version is null then
    raise exception using errcode = 'P0001', message = 'invalid_input:expected_version';
  end if;
  if p_site_id is null then
    raise exception using errcode = 'P0001', message = 'invalid_input:site_id';
  end if;
  if p_study_key is null or length(trim(p_study_key)) = 0 then
    p_study_key := 'STUDY-1';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = 'P0001', message = 'invalid_input:items';
  end if;

  -- Lock deal row and validate version (atomic concurrency gate).
  select deal_id, site_id, version, status
    into v_deal
  from public.negotiation_deals
  where deal_id = p_deal_id
  for update;

  if v_deal.deal_id is null then
    raise exception using errcode = 'P0001', message = 'not_found:deal';
  end if;
  if v_deal.site_id <> p_site_id then
    -- Avoid cross-site writes even if caller guesses deal id.
    raise exception using errcode = 'P0001', message = 'forbidden:site_mismatch';
  end if;
  if v_deal.status = 'closed' then
    raise exception using errcode = 'P0001', message = 'conflict:deal_closed';
  end if;
  if v_deal.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'conflict:version';
  end if;

  -- Upsert items.
  insert into public.negotiation_items (
    deal_id,
    user_id,
    site_id,
    study_key,
    study_name,
    stable_key,
    source_line_id,
    line_code,
    label,
    category,
    visit_name,
    quantity,
    unit,
    current_price,
    internal_cost,
    proposed_price,
    justification,
    status,
    updated_at
  )
  select
    p_deal_id,
    v_user_id,
    p_site_id,
    p_study_key,
    nullif(trim(coalesce(p_study_name, '')), ''),
    nullif(trim(coalesce(t.stable_key, '')), ''),
    t.source_line_id,
    t.line_code,
    t.label,
    t.category,
    t.visit_name,
    coalesce(t.quantity, 0),
    coalesce(t.unit, ''),
    coalesce(t.current_price, 0),
    coalesce(t.internal_cost, 0),
    coalesce(t.proposed_price, 0),
    coalesce(t.justification, ''),
    t.status,
    v_now
  from jsonb_to_recordset(p_items) as t(
    stable_key text,
    source_line_id text,
    line_code text,
    label text,
    category text,
    visit_name text,
    quantity numeric,
    unit text,
    current_price numeric,
    internal_cost numeric,
    proposed_price numeric,
    justification text,
    status text
  )
  on conflict (deal_id, source_line_id)
  do update set
    stable_key = excluded.stable_key,
    line_code = excluded.line_code,
    label = excluded.label,
    category = excluded.category,
    visit_name = excluded.visit_name,
    quantity = excluded.quantity,
    unit = excluded.unit,
    current_price = excluded.current_price,
    internal_cost = excluded.internal_cost,
    proposed_price = excluded.proposed_price,
    justification = excluded.justification,
    status = excluded.status,
    updated_at = excluded.updated_at;

  -- Compute financials using the same rules as the TS helper:
  -- total_target uses current_price when status='rejected', else proposed_price.
  select jsonb_build_object(
    'total_sponsor', coalesce(sum(coalesce(current_price, 0)), 0),
    'total_internal', coalesce(sum(coalesce(internal_cost, 0)), 0),
    'total_target', coalesce(sum(case when status = 'rejected' then coalesce(current_price, 0) else coalesce(proposed_price, 0) end), 0),
    'upside', coalesce(sum(case when status = 'rejected' then coalesce(current_price, 0) else coalesce(proposed_price, 0) end), 0) - coalesce(sum(coalesce(current_price, 0)), 0),
    'margin',
      (coalesce(sum(case when status = 'rejected' then coalesce(current_price, 0) else coalesce(proposed_price, 0) end), 0) - coalesce(sum(coalesce(internal_cost, 0)), 0))
      / greatest(coalesce(sum(coalesce(internal_cost, 0)), 0), 1e-9)
  )
  into v_financials
  from public.negotiation_items
  where deal_id = p_deal_id;

  -- Audit snapshot (save).
  insert into public.negotiation_round_snapshots (
    deal_id, user_id, site_id, study_key, study_name, kind, financials, items
  ) values (
    p_deal_id,
    v_user_id,
    p_site_id,
    p_study_key,
    nullif(trim(coalesce(p_study_name, '')), ''),
    'save',
    v_financials,
    p_items
  );

  -- Bump deal version and timestamps.
  update public.negotiation_deals
  set
    version = version + 1,
    last_updated_at = v_now,
    last_updated_by = v_user_id
  where deal_id = p_deal_id;

  return query
  select d.version, d.last_updated_at, d.last_updated_by
  from public.negotiation_deals d
  where d.deal_id = p_deal_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- close_negotiation_deal_atomic
-- ---------------------------------------------------------------------------
create or replace function public.close_negotiation_deal_atomic(
  p_deal_id uuid,
  p_site_id uuid,
  p_study_key text,
  p_study_name text,
  p_engine_input jsonb default null
)
returns table (
  agreement_id uuid,
  closed_at timestamptz,
  financials jsonb
)
language plpgsql
as $$
declare
  v_deal record;
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_financials jsonb;
  v_items jsonb;
  v_agreement record;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'unauthorized';
  end if;
  if p_deal_id is null then
    raise exception using errcode = 'P0001', message = 'invalid_input:deal_id';
  end if;
  if p_site_id is null then
    raise exception using errcode = 'P0001', message = 'invalid_input:site_id';
  end if;
  if p_study_key is null or length(trim(p_study_key)) = 0 then
    p_study_key := 'STUDY-1';
  end if;

  -- Lock deal row and verify state.
  select deal_id, site_id, status
    into v_deal
  from public.negotiation_deals
  where deal_id = p_deal_id
  for update;

  if v_deal.deal_id is null then
    raise exception using errcode = 'P0001', message = 'not_found:deal';
  end if;
  if v_deal.site_id <> p_site_id then
    raise exception using errcode = 'P0001', message = 'forbidden:site_mismatch';
  end if;
  if v_deal.status = 'closed' then
    raise exception using errcode = 'P0001', message = 'conflict:already_closed';
  end if;

  -- Read items and compute financial summary.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'source_line_id', source_line_id,
        'line_code', line_code,
        'label', label,
        'category', category,
        'visit_name', visit_name,
        'quantity', quantity,
        'unit', unit,
        'current_price', current_price,
        'internal_cost', internal_cost,
        'proposed_price', proposed_price,
        'justification', justification,
        'status', status,
        'updated_at', updated_at
      )
      order by updated_at desc
    ),
    '[]'::jsonb
  )
  into v_items
  from public.negotiation_items
  where deal_id = p_deal_id;

  select jsonb_build_object(
    'total_sponsor', coalesce(sum(coalesce(current_price, 0)), 0),
    'total_internal', coalesce(sum(coalesce(internal_cost, 0)), 0),
    'total_target', coalesce(sum(case when status = 'rejected' then coalesce(current_price, 0) else coalesce(proposed_price, 0) end), 0),
    'upside', coalesce(sum(case when status = 'rejected' then coalesce(current_price, 0) else coalesce(proposed_price, 0) end), 0) - coalesce(sum(coalesce(current_price, 0)), 0),
    'margin',
      (coalesce(sum(case when status = 'rejected' then coalesce(current_price, 0) else coalesce(proposed_price, 0) end), 0) - coalesce(sum(coalesce(internal_cost, 0)), 0))
      / greatest(coalesce(sum(coalesce(internal_cost, 0)), 0), 1e-9)
  )
  into v_financials
  from public.negotiation_items
  where deal_id = p_deal_id;

  -- Audit snapshot (close).
  insert into public.negotiation_round_snapshots (
    deal_id, user_id, site_id, study_key, study_name, kind, financials, items
  ) values (
    p_deal_id,
    v_user_id,
    p_site_id,
    p_study_key,
    nullif(trim(coalesce(p_study_name, '')), ''),
    'close',
    v_financials,
    v_items
  );

  -- Close deal.
  update public.negotiation_deals
  set
    status = 'closed',
    last_updated_at = v_now,
    last_updated_by = v_user_id
  where deal_id = p_deal_id;

  -- Insert final agreement (deal_id is unique).
  insert into public.final_agreements (
    deal_id,
    user_id,
    site_id,
    study_key,
    study_name,
    total_sponsor,
    total_internal,
    total_target,
    upside,
    margin,
    closed_by,
    snapshot
  )
  values (
    p_deal_id,
    v_user_id,
    p_site_id,
    p_study_key,
    nullif(trim(coalesce(p_study_name, '')), ''),
    (v_financials->>'total_sponsor')::numeric,
    (v_financials->>'total_internal')::numeric,
    (v_financials->>'total_target')::numeric,
    (v_financials->>'upside')::numeric,
    (v_financials->>'margin')::numeric,
    v_user_id,
    jsonb_build_object(
      'dealId', p_deal_id,
      'siteId', p_site_id,
      'studyKey', p_study_key,
      'studyName', nullif(trim(coalesce(p_study_name, '')), ''),
      'closedAt', v_now,
      'closedBy', v_user_id,
      'financials', v_financials,
      'items', v_items,
      'engineInput', p_engine_input
    )
  )
  returning id, closed_at into v_agreement;

  return query
  select v_agreement.id, v_agreement.closed_at, v_financials;
end;
$$;

