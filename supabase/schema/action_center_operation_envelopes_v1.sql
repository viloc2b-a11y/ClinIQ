create table if not exists public.action_center_operation_envelopes (
  operation_id text primary key,
  timestamp timestamptz not null,
  kind text not null,
  status text not null,
  summary jsonb not null
);

create index if not exists idx_action_center_operation_envelopes_timestamp
  on public.action_center_operation_envelopes (timestamp asc);

create index if not exists idx_action_center_operation_envelopes_kind
  on public.action_center_operation_envelopes (kind);

create index if not exists idx_action_center_operation_envelopes_status
  on public.action_center_operation_envelopes (status);
