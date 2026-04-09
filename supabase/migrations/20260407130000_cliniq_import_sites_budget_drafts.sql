-- ClinIQ — coordinator sites, multiformat import sessions/lines, budget draft versions.
-- RLS: users only see rows they own or sites they belong to.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Sites & membership (ownership for imports / drafts)
-- ---------------------------------------------------------------------------
create table if not exists public.cliniq_sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_cliniq_sites_created_by on public.cliniq_sites (created_by);

create table if not exists public.cliniq_site_members (
  site_id uuid not null references public.cliniq_sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'coordinator', 'viewer')),
  primary key (site_id, user_id)
);

create index if not exists idx_cliniq_site_members_user_id on public.cliniq_site_members (user_id);

-- New site → creator becomes owner (SECURITY DEFINER bypasses RLS on members insert)
create or replace function public.cliniq_sites_after_insert_add_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cliniq_site_members (site_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

drop trigger if exists tr_cliniq_sites_after_insert_add_owner on public.cliniq_sites;
create trigger tr_cliniq_sites_after_insert_add_owner
  after insert on public.cliniq_sites
  for each row execute function public.cliniq_sites_after_insert_add_owner();

-- ---------------------------------------------------------------------------
-- Import sessions (one upload + intent; human review before confirm)
-- ---------------------------------------------------------------------------
create table if not exists public.cliniq_import_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id uuid not null references public.cliniq_sites (id) on delete cascade,
  study_key text not null default 'STUDY-1',
  study_name text,
  import_intent text not null
    check (import_intent in ('sponsor_budget', 'site_internal_budget', 'contract_financial')),
  status text not null
    check (status in ('parsed', 'in_review', 'confirmed', 'cancelled'))
    default 'in_review',
  original_filename text not null,
  mime_type text,
  file_ext text,
  parser_warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cliniq_import_sessions_user_id on public.cliniq_import_sessions (user_id);
create index if not exists idx_cliniq_import_sessions_site_id on public.cliniq_import_sessions (site_id);
create index if not exists idx_cliniq_import_sessions_status on public.cliniq_import_sessions (status);

-- ---------------------------------------------------------------------------
-- Import lines (canonical payload per row; coordinator can exclude/edit in app)
-- ---------------------------------------------------------------------------
create table if not exists public.cliniq_import_lines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cliniq_import_sessions (id) on delete cascade,
  sort_order int not null,
  excluded boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cliniq_import_lines_session_id on public.cliniq_import_lines (session_id);

-- ---------------------------------------------------------------------------
-- Budget draft versions (post-review snapshot for Budget Gap handoff)
-- ---------------------------------------------------------------------------
create table if not exists public.cliniq_budget_draft_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  site_id uuid not null references public.cliniq_sites (id) on delete cascade,
  study_key text not null default 'STUDY-1',
  study_name text,
  import_intent text not null
    check (import_intent in ('sponsor_budget', 'site_internal_budget', 'contract_financial')),
  label text not null default 'Draft',
  internal_lines jsonb not null default '[]'::jsonb,
  sponsor_lines jsonb not null default '[]'::jsonb,
  source_import_session_id uuid references public.cliniq_import_sessions (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cliniq_budget_draft_versions_user_id on public.cliniq_budget_draft_versions (user_id);
create index if not exists idx_cliniq_budget_draft_versions_site_id on public.cliniq_budget_draft_versions (site_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.cliniq_sites enable row level security;
alter table public.cliniq_site_members enable row level security;
alter table public.cliniq_import_sessions enable row level security;
alter table public.cliniq_import_lines enable row level security;
alter table public.cliniq_budget_draft_versions enable row level security;

-- Sites: visible if member; insert if created_by = self
create policy cliniq_sites_select_member
  on public.cliniq_sites for select
  using (
    exists (
      select 1 from public.cliniq_site_members m
      where m.site_id = cliniq_sites.id and m.user_id = auth.uid()
    )
  );

create policy cliniq_sites_insert_owner
  on public.cliniq_sites for insert
  with check (created_by = auth.uid());

create policy cliniq_sites_update_owner
  on public.cliniq_sites for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Members: visible to self; insert/update only via trigger is security definer — allow select for own rows
create policy cliniq_site_members_select_self
  on public.cliniq_site_members for select
  using (user_id = auth.uid());

-- First row for a site (owner row from trigger, or bootstrap) OR owner inviting others
create policy cliniq_site_members_insert
  on public.cliniq_site_members for insert
  with check (
    user_id = auth.uid()
    and (
      not exists (
        select 1 from public.cliniq_site_members m0 where m0.site_id = cliniq_site_members.site_id
      )
      or exists (
        select 1 from public.cliniq_site_members m
        where m.site_id = cliniq_site_members.site_id
          and m.user_id = auth.uid()
          and m.role = 'owner'
      )
    )
  );

-- Import sessions: owner = user_id
create policy cliniq_import_sessions_select_own
  on public.cliniq_import_sessions for select
  using (user_id = auth.uid());

create policy cliniq_import_sessions_insert_own
  on public.cliniq_import_sessions for insert
  with check (user_id = auth.uid());

create policy cliniq_import_sessions_update_own
  on public.cliniq_import_sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy cliniq_import_sessions_delete_own
  on public.cliniq_import_sessions for delete
  using (user_id = auth.uid());

-- Import lines: via session ownership
create policy cliniq_import_lines_all_via_session
  on public.cliniq_import_lines for all
  using (
    exists (
      select 1 from public.cliniq_import_sessions s
      where s.id = cliniq_import_lines.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cliniq_import_sessions s
      where s.id = cliniq_import_lines.session_id and s.user_id = auth.uid()
    )
  );

-- Budget drafts: owner = user_id
create policy cliniq_budget_draft_versions_select_own
  on public.cliniq_budget_draft_versions for select
  using (user_id = auth.uid());

create policy cliniq_budget_draft_versions_insert_own
  on public.cliniq_budget_draft_versions for insert
  with check (user_id = auth.uid());

create policy cliniq_budget_draft_versions_update_own
  on public.cliniq_budget_draft_versions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy cliniq_budget_draft_versions_delete_own
  on public.cliniq_budget_draft_versions for delete
  using (user_id = auth.uid());
