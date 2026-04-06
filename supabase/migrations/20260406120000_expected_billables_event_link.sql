-- Execution ingest: link expected_billables to event_log rows.
-- Adds non-breaking columns used by ingest-event.ts persistence.

alter table public.expected_billables
  add column if not exists event_log_id uuid;

alter table public.expected_billables
  add column if not exists subject_id text;

alter table public.expected_billables
  add column if not exists status text not null default 'pending';

create index if not exists idx_expected_billables_event_log_id
  on public.expected_billables (event_log_id);

create index if not exists idx_expected_billables_subject_id
  on public.expected_billables (subject_id);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'expected_billables'
      and constraint_name = 'expected_billables_event_log_id_fkey'
  ) then
    alter table public.expected_billables
      add constraint expected_billables_event_log_id_fkey
      foreign key (event_log_id) references public.event_log(id)
      on delete set null;
  end if;
end $$;

