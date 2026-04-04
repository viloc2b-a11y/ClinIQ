-- Fee template items: engine classification + rate strategy (starter template 30-fee readiness)

ALTER TABLE public.site_fee_template_items
  ADD COLUMN IF NOT EXISTS engine_behavior text;

UPDATE public.site_fee_template_items
SET engine_behavior = 'operational_billable'
WHERE engine_behavior IS NULL;

ALTER TABLE public.site_fee_template_items
  ALTER COLUMN engine_behavior SET DEFAULT 'operational_billable',
  ALTER COLUMN engine_behavior SET NOT NULL;

ALTER TABLE public.site_fee_template_items
  ADD CONSTRAINT site_fee_template_items_engine_behavior_chk CHECK (
    engine_behavior IN (
      'operational_billable',
      'negotiation_only',
      'pricing_rule'
    )
  );

ALTER TABLE public.site_fee_template_items
  ADD COLUMN IF NOT EXISTS default_rate_strategy text;

ALTER TABLE public.site_fee_template_items
  ADD CONSTRAINT site_fee_template_items_default_rate_strategy_chk CHECK (
    default_rate_strategy IS NULL
    OR default_rate_strategy IN (
      'range_based',
      'per_event_estimated',
      'cost_plus_markup',
      'percent_of_total',
      'annual_uplift'
    )
  );

CREATE INDEX IF NOT EXISTS site_fee_template_items_engine_behavior_idx
  ON public.site_fee_template_items (engine_behavior)
  WHERE is_active = true;

COMMENT ON COLUMN public.site_fee_template_items.engine_behavior IS
  'operational_billable | negotiation_only | pricing_rule — v1 RPC still keys only the 5 clinical events; other rows seed negotiation/gap use.';

COMMENT ON COLUMN public.site_fee_template_items.default_rate_strategy IS
  'How default_rate / percent_rate should be interpreted for gap analysis and negotiation.';
