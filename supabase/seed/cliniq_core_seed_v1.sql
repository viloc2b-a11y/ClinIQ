-- ClinIQ core v1 — pricing seed (data only; requires cliniq_core_v1.sql schema)
-- Idempotent: deterministic profile/template PKs; ON CONFLICT on natural uniques.

-- Deterministic UUIDs (stable across re-seed for FK references)
-- site_cost_profiles.id
-- site_fee_templates.id (also resolvable via unique site_id + version)

-- ---------------------------------------------------------------------------
-- 1) site_cost_profiles
-- ---------------------------------------------------------------------------
insert into public.site_cost_profiles (
  id,
  site_id,
  name,
  overhead_percent,
  margin_target,
  nnn_monthly,
  market,
  site_type,
  calibration_year,
  is_active,
  created_at,
  updated_at
)
values (
  'c1c10001-0001-4000-8000-000000000001'::uuid,
  'VILO-KATY-001',
  'Houston Small Independent 2025-2026',
  0.32,
  0.20,
  4200.00,
  'Houston/Texas',
  'small_independent',
  '2025-2026',
  true,
  now(),
  now()
)
on conflict (id) do update set
  site_id = excluded.site_id,
  name = excluded.name,
  overhead_percent = excluded.overhead_percent,
  margin_target = excluded.margin_target,
  nnn_monthly = excluded.nnn_monthly,
  market = excluded.market,
  site_type = excluded.site_type,
  calibration_year = excluded.calibration_year,
  is_active = excluded.is_active,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 2) role_costs
-- ---------------------------------------------------------------------------
insert into public.role_costs (
  site_cost_profile_id,
  role_code,
  hourly_cost,
  created_at,
  updated_at
)
values
  ('c1c10001-0001-4000-8000-000000000001'::uuid, 'CRC', 82.50, now(), now()),
  ('c1c10001-0001-4000-8000-000000000001'::uuid, 'PI', 185.00, now(), now()),
  ('c1c10001-0001-4000-8000-000000000001'::uuid, 'SubI', 145.00, now(), now()),
  ('c1c10001-0001-4000-8000-000000000001'::uuid, 'Lab', 55.00, now(), now()),
  ('c1c10001-0001-4000-8000-000000000001'::uuid, 'Admin', 38.00, now(), now())
on conflict (site_cost_profile_id, role_code) do update set
  hourly_cost = excluded.hourly_cost,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3) site_fee_templates
-- ---------------------------------------------------------------------------
insert into public.site_fee_templates (
  id,
  site_id,
  version,
  market,
  calibration_year,
  currency,
  site_type,
  default_overhead_rate,
  default_margin_target,
  is_active,
  created_at,
  updated_at
)
values (
  'c1c10002-0002-4000-8000-000000000001'::uuid,
  'VILO-KATY-001',
  1,
  'Houston/Texas',
  '2025-2026',
  'USD',
  'small_independent',
  0.32,
  0.20,
  true,
  now(),
  now()
)
on conflict (site_id, version) do update set
  market = excluded.market,
  calibration_year = excluded.calibration_year,
  currency = excluded.currency,
  site_type = excluded.site_type,
  default_overhead_rate = excluded.default_overhead_rate,
  default_margin_target = excluded.default_margin_target,
  is_active = excluded.is_active,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 4) site_fee_template_items
-- ---------------------------------------------------------------------------
with tpl as (
  select id
  from public.site_fee_templates
  where site_id = 'VILO-KATY-001' and version = 1
)
insert into public.site_fee_template_items (
  site_fee_template_id,
  fee_code,
  fee_name,
  category,
  unit,
  "trigger",
  billing,
  payment_terms,
  priority,
  negotiation_category,
  min_acceptable_percent,
  max_concession,
  pricing_low,
  pricing_mid,
  pricing_high,
  pricing_recommended,
  markup_on_cost,
  payment_strategy,
  justification_template,
  notes,
  created_at,
  updated_at
)
select
  tpl.id,
  v.fee_code,
  v.fee_name,
  v.category,
  v.unit,
  v.trg,
  v.billing,
  v.payment_terms,
  v.priority,
  v.negotiation_category,
  v.min_acceptable_percent,
  v.max_concession,
  v.pricing_low,
  v.pricing_mid,
  v.pricing_high,
  v.pricing_recommended,
  v.markup_on_cost,
  v.payment_strategy,
  v.justification_template,
  v.notes,
  now(),
  now()
from tpl
cross join lateral (
  values
    (
      'SF-START-001'::text,
      'Study Startup / Site Activation Fee'::text,
      'Startup'::text,
      'OneTime'::text,
      'CTA_fully_executed'::text,
      'immediate_after_signature'::text,
      'Net-30'::text,
      'must_win'::text,
      'MustWin'::text,
      0.90::numeric(6, 4),
      0.05::numeric(6, 4),
      4500::numeric(12, 2),
      6000::numeric(12, 2),
      8000::numeric(12, 2),
      6200::numeric(12, 2),
      null::numeric(6, 4),
      '50% at CTA execution + 50% at SIV completion'::text,
      'Covers full site activation including SIV preparation, regulatory document setup, team coordination and system configuration in Houston. Based on actual staff hours at local HBR rates.'::text,
      'Most critical cash flow protector. Never go below 90% of target.'::text
    ),
    (
      'PP-SCR-001',
      'Screening Visit (V1)',
      'PerPatient',
      'Visit',
      'screening_visit_completed',
      'monthly',
      'Net-30',
      'must_win',
      'MustWin',
      0.90,
      0.10,
      380,
      520,
      680,
      520,
      null,
      'Monthly consolidated invoice',
      'Includes informed consent (avg 60-70 min), complete medical history, ECG, laboratory draws, physical exam and data entry with complexity buffer applied per therapeutic area.',
      'Highest effort visit. Never accept below cost. Complexity multiplier applied automatically.'
    ),
    (
      'PP-RAND-001',
      'Randomization / Baseline Visit',
      'PerPatient',
      'Visit',
      'randomization_visit_completed',
      'monthly',
      'Net-30',
      'must_win',
      'MustWin',
      0.88,
      0.10,
      250,
      360,
      480,
      360,
      null,
      'Monthly consolidated invoice',
      'Covers randomization procedures, baseline documentation and complexity-adjusted site effort.',
      'Second most critical per-patient fee. Defend strongly.'
    ),
    (
      'PP-FUP-001',
      'Follow-up Visit',
      'PerPatient',
      'Visit',
      'followup_visit_completed',
      'monthly',
      'Net-30',
      'defendable',
      'Defendable',
      0.88,
      0.12,
      150,
      210,
      290,
      210,
      null,
      'Monthly consolidated invoice',
      'Covers clinical evaluation, laboratory work, ECG where applicable, data entry and query resolution with therapeutic-area complexity applied.',
      'High volume visit. Total follow-up revenue often exceeds screening in longer studies.'
    ),
    (
      'INV-SF-001',
      'Screen Failure Fee',
      'Invoiceable',
      'PerPatient',
      'screen_failure_confirmed',
      'immediate_or_monthly_batch',
      'Net-30',
      'must_win',
      'MustWin',
      0.90,
      0.05,
      350,
      530,
      750,
      530,
      null,
      'Per occurrence or monthly batch — never quarterly',
      'Based on site historical screen failure ratio and actual pre-screening effort. Covers consent process, chart review and exclusion documentation.',
      'Critical for diabetes and complex protocols. Zero tolerance for 0-dollar screen failure offers.'
    ),
    (
      'INV-AMD-001',
      'Protocol Amendment Fee',
      'Invoiceable',
      'PerAmendment',
      'amendment_approved_by_IRB_or_sponsor',
      'within_15_days_of_approval',
      'Net-30',
      'must_win',
      'MustWin',
      0.88,
      0.10,
      950,
      1700,
      2500,
      1700,
      null,
      'Invoice within 15 days of approval. Recommend payment before implementation.',
      'Each amendment requires regulatory review, document updates, team retraining and potential patient re-consent.',
      'Never accept zero-dollar amendment clauses.'
    ),
    (
      'INV-DRY-001',
      'Dry Ice, Shipping & Specimen Handling',
      'PassThrough',
      'PerShipment',
      'specimen_shipment_completed',
      'monthly_or_batch',
      'Net-30',
      'tradeoff',
      'Tradeoff',
      0.75,
      0.25,
      65,
      95,
      135,
      95,
      0.20,
      'Monthly batch with shipment log',
      'Covers actual dry ice cost, specimen packaging, courier fees and administrative time for shipment preparation and documentation.',
      'Use as tradeoff currency. Yield here to protect Startup and Screen Failure fees.'
    ),
    (
      'INV-ARC-001',
      'Long-term Archiving Fee',
      'Closeout',
      'OneTime',
      'study_closeout_completed',
      'at_closeout',
      'Net-30',
      'must_win',
      'MustWin',
      0.90,
      0.05,
      1400,
      2000,
      2600,
      2000,
      null,
      '100% at closeout. Tied to holdback release.',
      'Covers secure document storage for 15-25 years per FDA/ICH-GCP requirements.',
      'Zero tolerance for omission. Tie to holdback release in contract.'
    )
) as v (
  fee_code,
  fee_name,
  category,
  unit,
  trg,
  billing,
  payment_terms,
  priority,
  negotiation_category,
  min_acceptable_percent,
  max_concession,
  pricing_low,
  pricing_mid,
  pricing_high,
  pricing_recommended,
  markup_on_cost,
  payment_strategy,
  justification_template,
  notes
)
on conflict (site_fee_template_id, fee_code) do update set
  fee_name = excluded.fee_name,
  category = excluded.category,
  unit = excluded.unit,
  "trigger" = excluded."trigger",
  billing = excluded.billing,
  payment_terms = excluded.payment_terms,
  priority = excluded.priority,
  negotiation_category = excluded.negotiation_category,
  min_acceptable_percent = excluded.min_acceptable_percent,
  max_concession = excluded.max_concession,
  pricing_low = excluded.pricing_low,
  pricing_mid = excluded.pricing_mid,
  pricing_high = excluded.pricing_high,
  pricing_recommended = excluded.pricing_recommended,
  markup_on_cost = excluded.markup_on_cost,
  payment_strategy = excluded.payment_strategy,
  justification_template = excluded.justification_template,
  notes = excluded.notes,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 5) site_fee_complexity_prices
-- ---------------------------------------------------------------------------
with items as (
  select i.id, i.fee_code
  from public.site_fee_template_items i
  join public.site_fee_templates t on t.id = i.site_fee_template_id
  where t.site_id = 'VILO-KATY-001' and t.version = 1
),
pairs as (
  select * from (values
    ('PP-SCR-001', 'vaccine', 380::numeric(12, 2)),
    ('PP-SCR-001', 'cardiovascular', 437),
    ('PP-SCR-001', 'diabetes', 520),
    ('PP-SCR-001', 'neurology', 624),
    ('PP-SCR-001', 'gastro', 572),
    ('PP-RAND-001', 'vaccine', 250),
    ('PP-RAND-001', 'cardiovascular', 288),
    ('PP-RAND-001', 'diabetes', 360),
    ('PP-RAND-001', 'neurology', 432),
    ('PP-RAND-001', 'gastro', 396),
    ('PP-FUP-001', 'vaccine', 150),
    ('PP-FUP-001', 'cardiovascular', 173),
    ('PP-FUP-001', 'diabetes', 218),
    ('PP-FUP-001', 'neurology', 261),
    ('PP-FUP-001', 'gastro', 241),
    ('INV-SF-001', 'vaccine', 350),
    ('INV-SF-001', 'cardiovascular', 403),
    ('INV-SF-001', 'diabetes', 530),
    ('INV-SF-001', 'neurology', 636),
    ('INV-SF-001', 'gastro', 583)
  ) as x(fee_code, therapeutic_area, adjusted_price)
)
insert into public.site_fee_complexity_prices (
  site_fee_template_item_id,
  therapeutic_area,
  adjusted_price,
  created_at,
  updated_at
)
select
  i.id,
  p.therapeutic_area,
  p.adjusted_price,
  now(),
  now()
from pairs p
join items i on i.fee_code = p.fee_code
on conflict (site_fee_template_item_id, therapeutic_area) do update set
  adjusted_price = excluded.adjusted_price,
  updated_at = now();
