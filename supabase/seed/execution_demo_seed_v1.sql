-- ClinIQ — execution demo seed (v1)
-- Purpose: minimal demo data for the unified execution dashboard (/dashboard) + runner (/api/execution/run).
-- Uses study_key = 'STUDY-1' (text) and a fixed UUID study/site for billable_instances engine tables.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- A) expected_billables (SoA-aligned)
-- ---------------------------------------------------------------------------
delete from public.expected_billables where study_id = 'STUDY-1';

insert into public.expected_billables (
  study_id,
  budget_line_id,
  line_code,
  label,
  category,
  visit_name,
  unit,
  expected_quantity,
  unit_price,
  expected_revenue
) values
  ('STUDY-1', 'BL-ECG-1', 'ECG', 'ECG (Visit 1)', 'procedure', 'Visit 1', 'flat', 1, 150, 150),
  ('STUDY-1', 'BL-CBC-1', 'CBC', 'CBC (Visit 1)', 'lab',       'Visit 1', 'flat', 1, 1200, 1200),
  ('STUDY-1', 'BL-MRI-1', 'MRI', 'MRI (Visit 2)', 'imaging',   'Visit 2', 'flat', 1, 450, 450);

-- ---------------------------------------------------------------------------
-- B) event_log (executed events)
-- ---------------------------------------------------------------------------
delete from public.event_log where study_id = 'STUDY-1';

insert into public.event_log (
  study_id,
  subject_id,
  visit_name,
  event_type,
  event_date
) values
  ('STUDY-1', 'SUB-001', 'Visit 1', 'visit_completed', now() - interval '10 days'),
  ('STUDY-1', 'SUB-002', 'Visit 1', 'visit_completed', now() - interval '9 days'),
  ('STUDY-1', 'SUB-001', 'Visit 2', 'visit_completed', now() - interval '3 days');

-- ---------------------------------------------------------------------------
-- C) billable_instances (actual billables created by engine)
-- NOTE: billable_instances uses UUID study_id/site_id; execution dashboard joins via execution_study_key text.
-- ---------------------------------------------------------------------------
-- Demo constants (stable for reruns)
--   study_id: e1000000-0000-4000-8000-000000000001
--   site_id:  e2000000-0000-4000-8000-000000000001
--   source_event_id: e3000000-0000-4000-8000-000000000001

delete from public.billable_instances where execution_study_key = 'STUDY-1';

insert into public.billable_instances (
  study_id,
  site_id,
  subject_id,
  visit_id,
  fee_code,
  template_item_id,
  source_event_id,
  source_event_type,
  amount,
  quantity,
  status,
  document_complete,
  invoice_required,
  execution_study_key,
  metadata_json
) values
  (
    'e1000000-0000-4000-8000-000000000001'::uuid,
    'e2000000-0000-4000-8000-000000000001'::uuid,
    null,
    null,
    'ECG',
    null,
    'e3000000-0000-4000-8000-000000000001'::uuid,
    'visit_completed',
    150,
    1,
    'earned',
    false,
    true,
    'STUDY-1',
    '{}'::jsonb
  );

-- Expected but missing: CBC (1200) and MRI (450) -> should appear as prioritized missing items.

