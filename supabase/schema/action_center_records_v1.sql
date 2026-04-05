create table if not exists public.action_center_records (
  id text primary key,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_action_center_records_created_at
  on public.action_center_records (created_at desc);
