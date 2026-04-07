-- ClinIQ — Active deal resolution + concurrency safety.
-- Adds negotiation_deals registry so deals resolve by site+study across devices.

create extension if not exists "pgcrypto";

create table if not exists public.negotiation_deals (
  deal_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id uuid not null references public.cliniq_sites (id) on delete cascade,
  study_key text not null default 'STUDY-1',
  study_name text,
  status text not null check (status in ('open', 'closed')) default 'open',
  version int not null default 1,
  last_updated_at timestamptz not null default now(),
  last_updated_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- One active (open) deal per site+study.
create unique index if not exists uq_negotiation_deals_open_site_study
  on public.negotiation_deals (site_id, study_key)
  where status = 'open';

create index if not exists idx_negotiation_deals_user on public.negotiation_deals (user_id, created_at desc);
create index if not exists idx_negotiation_deals_site on public.negotiation_deals (site_id, created_at desc);
create index if not exists idx_negotiation_deals_status on public.negotiation_deals (status);

alter table public.negotiation_deals enable row level security;

create policy negotiation_deals_select_own
  on public.negotiation_deals for select
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.cliniq_site_members m
      where m.site_id = negotiation_deals.site_id and m.user_id = auth.uid()
    )
  );

create policy negotiation_deals_insert_own
  on public.negotiation_deals for insert
  with check (
    user_id = auth.uid()
    and last_updated_by = auth.uid()
    and exists (
      select 1 from public.cliniq_site_members m
      where m.site_id = negotiation_deals.site_id and m.user_id = auth.uid()
    )
  );

create policy negotiation_deals_update_own
  on public.negotiation_deals for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy negotiation_deals_delete_own
  on public.negotiation_deals for delete
  using (user_id = auth.uid());

