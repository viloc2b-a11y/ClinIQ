-- ClinIQ — Negotiation durability + audit layer.
-- Adds stable line identity + round snapshots without changing existing flows.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Stable identity per budget line (independent of UI order / source_line_id drift)
-- ---------------------------------------------------------------------------
alter table public.negotiation_items
  add column if not exists stable_key text;

create index if not exists idx_negotiation_items_stable_key on public.negotiation_items (stable_key);

-- Best-effort backfill (works when existing rows have line fields populated).
update public.negotiation_items
set stable_key = encode(
  digest(
    lower(trim(coalesce(line_code, ''))) || '|' ||
    lower(trim(coalesce(category, ''))) || '|' ||
    lower(trim(coalesce(visit_name, ''))) || '|' ||
    lower(trim(coalesce(label, ''))) || '|' ||
    lower(trim(coalesce(unit, ''))),
    'sha256'
  ),
  'hex'
)
where stable_key is null;

-- ---------------------------------------------------------------------------
-- Negotiation round snapshots (save-history / audit)
-- ---------------------------------------------------------------------------
create table if not exists public.negotiation_round_snapshots (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id uuid not null references public.cliniq_sites (id) on delete cascade,
  study_key text not null default 'STUDY-1',
  study_name text,
  kind text not null check (kind in ('save', 'close')),
  created_at timestamptz not null default now(),
  financials jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb
);

create index if not exists idx_negotiation_round_snapshots_deal on public.negotiation_round_snapshots (deal_id, created_at desc);
create index if not exists idx_negotiation_round_snapshots_user on public.negotiation_round_snapshots (user_id, created_at desc);
create index if not exists idx_negotiation_round_snapshots_site on public.negotiation_round_snapshots (site_id, created_at desc);

alter table public.negotiation_round_snapshots enable row level security;

create policy negotiation_round_snapshots_select_own
  on public.negotiation_round_snapshots for select
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.cliniq_site_members m
      where m.site_id = negotiation_round_snapshots.site_id and m.user_id = auth.uid()
    )
  );

create policy negotiation_round_snapshots_insert_own
  on public.negotiation_round_snapshots for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.cliniq_site_members m
      where m.site_id = negotiation_round_snapshots.site_id and m.user_id = auth.uid()
    )
  );

create policy negotiation_round_snapshots_delete_own
  on public.negotiation_round_snapshots for delete
  using (user_id = auth.uid());

