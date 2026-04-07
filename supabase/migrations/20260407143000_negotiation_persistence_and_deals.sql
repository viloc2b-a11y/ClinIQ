-- ClinIQ — Negotiation persistence (Module 4) + deal closure snapshot.
-- Builds on existing site membership + auth.uid() patterns.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Negotiation items (per deal + per budget-gap line)
-- ---------------------------------------------------------------------------
create table if not exists public.negotiation_items (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id uuid not null references public.cliniq_sites (id) on delete cascade,
  study_key text not null default 'STUDY-1',
  study_name text,

  -- Link back to Module 3 line identity (not a FK; comes from Budget Gap output)
  source_line_id text not null,
  line_code text not null,
  label text not null,
  category text not null,
  visit_name text not null,
  quantity numeric not null default 0,
  unit text not null default '',

  current_price numeric not null default 0,   -- sponsor offer total for that line
  internal_cost numeric not null default 0,   -- internal modeled total
  proposed_price numeric not null default 0,  -- editable
  justification text not null default '',
  status text not null check (status in ('pending', 'accepted', 'rejected')) default 'pending',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (deal_id, source_line_id)
);

create index if not exists idx_negotiation_items_deal_id on public.negotiation_items (deal_id);
create index if not exists idx_negotiation_items_user_id on public.negotiation_items (user_id);
create index if not exists idx_negotiation_items_site_id on public.negotiation_items (site_id);
create index if not exists idx_negotiation_items_status on public.negotiation_items (status);

-- ---------------------------------------------------------------------------
-- Final agreements (deal closure)
-- ---------------------------------------------------------------------------
create table if not exists public.final_agreements (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id uuid not null references public.cliniq_sites (id) on delete cascade,
  study_key text not null default 'STUDY-1',
  study_name text,

  total_sponsor numeric not null default 0,
  total_internal numeric not null default 0,
  total_target numeric not null default 0,
  upside numeric not null default 0,
  margin numeric not null default 0, -- (total_target - total_internal) / max(total_internal, eps)

  closed_at timestamptz not null default now(),
  closed_by uuid not null references auth.users (id) on delete cascade,

  -- Full persisted deal payload for audit/replay (items + computed totals + engine snapshot if present)
  snapshot jsonb not null default '{}'::jsonb
);

create index if not exists idx_final_agreements_user_id on public.final_agreements (user_id);
create index if not exists idx_final_agreements_site_id on public.final_agreements (site_id);
create index if not exists idx_final_agreements_closed_at on public.final_agreements (closed_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.negotiation_items enable row level security;
alter table public.final_agreements enable row level security;

-- Items: owner = user_id, and must be a member of site_id
create policy negotiation_items_select_own
  on public.negotiation_items for select
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.cliniq_site_members m
      where m.site_id = negotiation_items.site_id and m.user_id = auth.uid()
    )
  );

create policy negotiation_items_insert_own
  on public.negotiation_items for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.cliniq_site_members m
      where m.site_id = negotiation_items.site_id and m.user_id = auth.uid()
    )
  );

create policy negotiation_items_update_own
  on public.negotiation_items for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy negotiation_items_delete_own
  on public.negotiation_items for delete
  using (user_id = auth.uid());

-- Final agreements: owner = user_id, and must be a member of site_id
create policy final_agreements_select_own
  on public.final_agreements for select
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.cliniq_site_members m
      where m.site_id = final_agreements.site_id and m.user_id = auth.uid()
    )
  );

create policy final_agreements_insert_own
  on public.final_agreements for insert
  with check (
    user_id = auth.uid()
    and closed_by = auth.uid()
    and exists (
      select 1 from public.cliniq_site_members m
      where m.site_id = final_agreements.site_id and m.user_id = auth.uid()
    )
  );

create policy final_agreements_update_own
  on public.final_agreements for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy final_agreements_delete_own
  on public.final_agreements for delete
  using (user_id = auth.uid());

