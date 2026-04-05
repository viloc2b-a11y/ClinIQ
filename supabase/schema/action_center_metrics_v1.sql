create table if not exists public.action_center_metrics (
  key text primary key,
  writes_attempted integer not null default 0,
  writes_success integer not null default 0,
  writes_failed integer not null default 0,
  updated_at timestamptz not null default now()
);
