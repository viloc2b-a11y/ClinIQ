create extension if not exists "pgcrypto";

create table if not exists public.procedures_master (
  id uuid primary key default gen_random_uuid(),
  procedure_code text,
  name text not null,
  category text,
  unit text not null default 'occurrence',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_costs (
  id uuid primary key default gen_random_uuid(),
  role_code text not null unique,
  role_name text not null,
  hourly_cost numeric(12,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procedure_time (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedures_master(id) on delete cascade,
  role_code text not null,
  minutes numeric(10,2) not null check (minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(procedure_id, role_code)
);

create table if not exists public.site_cost_profiles (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  overhead_percent numeric(6,4) not null check (overhead_percent >= 0 and overhead_percent <= 1),
  margin_target numeric(6,4) not null check (margin_target >= 0 and margin_target <= 1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procedure_conditions (
  id uuid primary key default gen_random_uuid(),
  procedure_id uuid not null references public.procedures_master(id) on delete cascade,
  condition_type text not null,
  probability numeric(6,4) not null check (probability >= 0 and probability <= 1),
  cost_impact numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_procedures_master_updated_at on public.procedures_master;
create trigger trg_procedures_master_updated_at
before update on public.procedures_master
for each row execute function public.set_updated_at();

drop trigger if exists trg_role_costs_updated_at on public.role_costs;
create trigger trg_role_costs_updated_at
before update on public.role_costs
for each row execute function public.set_updated_at();

drop trigger if exists trg_procedure_time_updated_at on public.procedure_time;
create trigger trg_procedure_time_updated_at
before update on public.procedure_time
for each row execute function public.set_updated_at();

drop trigger if exists trg_site_cost_profiles_updated_at on public.site_cost_profiles;
create trigger trg_site_cost_profiles_updated_at
before update on public.site_cost_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_procedure_conditions_updated_at on public.procedure_conditions;
create trigger trg_procedure_conditions_updated_at
before update on public.procedure_conditions
for each row execute function public.set_updated_at();