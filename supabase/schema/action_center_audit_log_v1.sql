create table if not exists public.action_center_audit_log (
  id text not null,
  step text not null,
  timestamp timestamptz not null,
  primary key (id, step, timestamp)
);

create index if not exists idx_action_center_audit_log_timestamp
  on public.action_center_audit_log (timestamp asc);

create index if not exists idx_action_center_audit_log_id
  on public.action_center_audit_log (id);

create index if not exists idx_action_center_audit_log_step
  on public.action_center_audit_log (step);
