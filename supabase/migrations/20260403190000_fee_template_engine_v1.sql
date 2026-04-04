-- ClinIQ Fee Template Engine v1 — build spec (site templates → study snapshot → billables → invoices)
-- Replaces prior draft: single fee_code (immutable), text billable status, study snapshot JSONB, operational dedupe index.

-- ---------------------------------------------------------------------------
-- Optional: clean reinstall (comment out if you never applied an older revision)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_billable_from_event(uuid, uuid, uuid, uuid, text, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.create_billable_from_event(text, uuid, uuid, uuid, uuid, uuid, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.promote_earned_to_invoiceable(uuid) CASCADE;
DROP TABLE IF EXISTS public.invoice_package_items CASCADE;
DROP TABLE IF EXISTS public.invoice_packages CASCADE;
DROP TABLE IF EXISTS public.billable_instances CASCADE;
DROP TABLE IF EXISTS public.study_fee_templates CASCADE;
DROP TABLE IF EXISTS public.site_fee_template_items CASCADE;
DROP TABLE IF EXISTS public.site_fee_templates CASCADE;
DROP TYPE IF EXISTS public.billable_instance_status CASCADE;

-- ---------------------------------------------------------------------------
-- Shared triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_site_fee_template_item_fee_code_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.fee_code IS DISTINCT FROM OLD.fee_code THEN
    RAISE EXCEPTION 'fee_code is immutable on site_fee_template_items (id=%)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- A) site_fee_templates
-- ---------------------------------------------------------------------------
CREATE TABLE public.site_fee_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  therapeutic_area text,
  sponsor_scope text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX site_fee_templates_one_default_per_site
  ON public.site_fee_templates (site_id)
  WHERE is_default = true;

CREATE INDEX site_fee_templates_site_active_idx
  ON public.site_fee_templates (site_id)
  WHERE is_active = true;

CREATE TRIGGER site_fee_templates_set_updated_at
  BEFORE UPDATE ON public.site_fee_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- B) site_fee_template_items  (expandable to ~30+ fee rows)
-- ---------------------------------------------------------------------------
CREATE TABLE public.site_fee_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.site_fee_templates (id) ON DELETE CASCADE,
  fee_code text NOT NULL,
  fee_name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  default_rate numeric(12, 2),
  range_low numeric(12, 2),
  range_high numeric(12, 2),
  percent_rate numeric(6, 2),
  trigger_name text NOT NULL,
  trigger_type text NOT NULL,
  trigger_source text NOT NULL,
  billing_cycle text NOT NULL,
  payment_terms text NOT NULL,
  priority text NOT NULL,
  sponsor_visible boolean NOT NULL DEFAULT true,
  auto_create_billable boolean NOT NULL DEFAULT true,
  invoice_required boolean NOT NULL DEFAULT true,
  max_days_to_invoice int,
  justification_template text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_fee_template_items_template_fee_unique UNIQUE (template_id, fee_code)
);

CREATE INDEX site_fee_template_items_template_id_idx
  ON public.site_fee_template_items (template_id);

CREATE INDEX site_fee_template_items_fee_code_idx
  ON public.site_fee_template_items (fee_code)
  WHERE is_active = true;

CREATE INDEX site_fee_template_items_trigger_type_idx
  ON public.site_fee_template_items (trigger_type)
  WHERE is_active = true;

CREATE TRIGGER site_fee_template_items_fee_code_immutable
  BEFORE UPDATE ON public.site_fee_template_items
  FOR EACH ROW EXECUTE FUNCTION public.prevent_site_fee_template_item_fee_code_change();

CREATE TRIGGER site_fee_template_items_set_updated_at
  BEFORE UPDATE ON public.site_fee_template_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- C) study_fee_templates  (frozen snapshot per study)
-- ---------------------------------------------------------------------------
CREATE TABLE public.study_fee_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  site_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.site_fee_templates (id) ON DELETE RESTRICT,
  template_snapshot_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX study_fee_templates_study_id_idx
  ON public.study_fee_templates (study_id);

CREATE INDEX study_fee_templates_site_id_idx
  ON public.study_fee_templates (site_id);

CREATE INDEX study_fee_templates_template_id_idx
  ON public.study_fee_templates (template_id);

-- ---------------------------------------------------------------------------
-- D) billable_instances
-- ---------------------------------------------------------------------------
CREATE TABLE public.billable_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  site_id uuid NOT NULL,
  subject_id uuid,
  subject_dedupe uuid GENERATED ALWAYS AS (
    COALESCE(subject_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) STORED,
  visit_id uuid,
  fee_code text NOT NULL,
  template_item_id uuid REFERENCES public.site_fee_template_items (id) ON DELETE SET NULL,
  source_event_id uuid NOT NULL,
  source_event_type text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  quantity numeric(12, 2) NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'expected',
  document_complete boolean NOT NULL DEFAULT false,
  invoice_required boolean NOT NULL DEFAULT true,
  invoice_due_date date,
  earned_at timestamptz,
  invoiceable_at timestamptz,
  invoiced_at timestamptz,
  paid_at timestamptz,
  disputed_at timestamptz,
  notes text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billable_instances_status_chk CHECK (
    status IN (
      'expected',
      'earned',
      'invoiceable',
      'invoiced',
      'paid',
      'disputed'
    )
  )
);

CREATE UNIQUE INDEX billable_instances_operational_dedupe
  ON public.billable_instances (study_id, fee_code, source_event_id, subject_dedupe);

CREATE INDEX billable_instances_study_id_idx ON public.billable_instances (study_id);
CREATE INDEX billable_instances_site_id_idx ON public.billable_instances (site_id);
CREATE INDEX billable_instances_fee_code_idx ON public.billable_instances (fee_code);
CREATE INDEX billable_instances_status_idx ON public.billable_instances (status);
CREATE INDEX billable_instances_source_event_id_idx ON public.billable_instances (source_event_id);

CREATE TRIGGER billable_instances_set_updated_at
  BEFORE UPDATE ON public.billable_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- E) invoice_packages
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL,
  site_id uuid NOT NULL,
  sponsor_id uuid,
  invoice_period_start date NOT NULL,
  invoice_period_end date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invoice_packages_study_id_idx ON public.invoice_packages (study_id);
CREATE INDEX invoice_packages_site_id_idx ON public.invoice_packages (site_id);

CREATE TRIGGER invoice_packages_set_updated_at
  BEFORE UPDATE ON public.invoice_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- F) invoice_package_items
-- ---------------------------------------------------------------------------
CREATE TABLE public.invoice_package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_package_id uuid NOT NULL REFERENCES public.invoice_packages (id) ON DELETE CASCADE,
  billable_instance_id uuid NOT NULL REFERENCES public.billable_instances (id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_package_items_pkg_billable_unique UNIQUE (invoice_package_id, billable_instance_id)
);

CREATE INDEX invoice_package_items_package_id_idx
  ON public.invoice_package_items (invoice_package_id);

CREATE INDEX invoice_package_items_billable_id_idx
  ON public.invoice_package_items (billable_instance_id);

-- ---------------------------------------------------------------------------
-- Clinical event → fee_code (keep aligned with lib/cliniq-core/fee-templates/event-mapping.ts)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.map_clinical_event_to_fee_code(p_event_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE trim(lower(p_event_type))
    WHEN 'cta_fully_executed' THEN 'SF-START-001'
    WHEN 'screening_visit_completed' THEN 'PP-SCR-001'
    WHEN 'followup_visit_completed' THEN 'PP-FUP-001'
    WHEN 'screen_failure_confirmed' THEN 'INV-SF-001'
    WHEN 'amendment_approved' THEN 'INV-AMD-001'
    ELSE NULL
  END;
$$;

-- ---------------------------------------------------------------------------
-- create_billable_from_event(
--   event_type, event_id, study_id, site_id, subject_id, visit_id [, occurred_at]
-- )
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_billable_from_event(
  p_event_type text,
  p_event_id uuid,
  p_study_id uuid,
  p_site_id uuid,
  p_subject_id uuid,
  p_visit_id uuid,
  p_occurred_at timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee_code text;
  v_snapshot jsonb;
  v_study_tpl_id uuid;
  v_elem jsonb;
  v_item_id uuid;
  v_amount numeric(12, 2);
  v_max_days int;
  v_invoice_required boolean;
  v_auto_create boolean;
  v_new_id uuid;
BEGIN
  v_fee_code := public.map_clinical_event_to_fee_code(p_event_type);
  IF v_fee_code IS NULL THEN
    RAISE EXCEPTION 'Unmapped clinical event type: %', p_event_type;
  END IF;

  v_item_id := NULL;
  v_amount := NULL;
  v_max_days := NULL;
  v_invoice_required := true;
  v_auto_create := true;

  SELECT sft.id, sft.template_snapshot_json
  INTO v_study_tpl_id, v_snapshot
  FROM public.study_fee_templates sft
  WHERE sft.study_id = p_study_id
  ORDER BY sft.created_at DESC
  LIMIT 1;

  IF v_snapshot IS NOT NULL THEN
    SELECT e INTO v_elem
    FROM jsonb_array_elements(v_snapshot -> 'items') AS e
    WHERE e ->> 'fee_code' = v_fee_code
    LIMIT 1;

    IF v_elem IS NOT NULL THEN
      v_item_id := (v_elem ->> 'id')::uuid;
      v_amount := (v_elem ->> 'default_rate')::numeric;
      IF v_elem ? 'max_days_to_invoice' THEN
        v_max_days := (v_elem ->> 'max_days_to_invoice')::int;
      END IF;
      IF v_elem ? 'invoice_required' THEN
        v_invoice_required := COALESCE((v_elem ->> 'invoice_required')::boolean, true);
      END IF;
      IF v_elem ? 'auto_create_billable' THEN
        v_auto_create := COALESCE((v_elem ->> 'auto_create_billable')::boolean, true);
      END IF;
    END IF;
  END IF;

  IF v_item_id IS NULL OR v_amount IS NULL THEN
    SELECT
      i.id,
      i.default_rate,
      i.max_days_to_invoice,
      i.invoice_required,
      i.auto_create_billable
    INTO v_item_id, v_amount, v_max_days, v_invoice_required, v_auto_create
    FROM public.site_fee_template_items i
    INNER JOIN public.site_fee_templates t ON t.id = i.template_id
    WHERE t.site_id = p_site_id
      AND t.is_default = true
      AND t.is_active = true
      AND i.fee_code = v_fee_code
      AND i.is_active = true
    LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    SELECT
      i.id,
      i.default_rate,
      i.max_days_to_invoice,
      i.invoice_required,
      i.auto_create_billable
    INTO v_item_id, v_amount, v_max_days, v_invoice_required, v_auto_create
    FROM public.site_fee_template_items i
    INNER JOIN public.site_fee_templates t ON t.id = i.template_id
    WHERE t.site_id = 'e0000000-0000-4000-8000-000000000001'::uuid
      AND t.is_default = true
      AND t.is_active = true
      AND i.fee_code = v_fee_code
      AND i.is_active = true
    LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'No template item for fee_code=% (study %, site %)', v_fee_code, p_study_id, p_site_id;
  END IF;

  IF v_auto_create = false THEN
    RETURN NULL;
  END IF;

  v_amount := COALESCE(v_amount, 0);

  INSERT INTO public.billable_instances (
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
    invoice_due_date,
    earned_at,
    metadata_json
  )
  VALUES (
    p_study_id,
    p_site_id,
    p_subject_id,
    p_visit_id,
    v_fee_code,
    v_item_id,
    p_event_id,
    p_event_type,
    v_amount,
    1,
    'earned',
    false,
    COALESCE(v_invoice_required, true),
    CASE
      WHEN v_max_days IS NOT NULL THEN (p_occurred_at::date + make_interval(days => GREATEST(v_max_days, 0)))
      ELSE NULL
    END,
    p_occurred_at,
    '{}'::jsonb
  )
  ON CONFLICT (study_id, fee_code, source_event_id, subject_dedupe)
  DO NOTHING
  RETURNING id INTO v_new_id;

  IF v_new_id IS NULL THEN
    SELECT bi.id INTO v_new_id
    FROM public.billable_instances bi
    WHERE bi.study_id = p_study_id
      AND bi.fee_code = v_fee_code
      AND bi.source_event_id = p_event_id
      AND bi.subject_id IS NOT DISTINCT FROM p_subject_id
    LIMIT 1;
  END IF;

  RETURN v_new_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Invoice readiness: earned → invoiceable
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_earned_to_invoiceable(p_billable_id uuid DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  IF p_billable_id IS NULL THEN
    UPDATE public.billable_instances
    SET
      status = 'invoiceable',
      invoiceable_at = now(),
      updated_at = now()
    WHERE status = 'earned'
      AND invoice_required = true
      AND amount > 0
      AND document_complete = true;
  ELSE
    UPDATE public.billable_instances
    SET
      status = 'invoiceable',
      invoiceable_at = now(),
      updated_at = now()
    WHERE id = p_billable_id
      AND status = 'earned'
      AND invoice_required = true
      AND amount > 0
      AND document_complete = true;
  END IF;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

COMMENT ON FUNCTION public.create_billable_from_event IS
  'Creates an earned billable from a clinical event; idempotent on operational dedupe key; returns NULL if auto_create_billable is false.';

COMMENT ON FUNCTION public.promote_earned_to_invoiceable IS
  'Promotes earned billables to invoiceable when invoice_required, amount>0, document_complete.';

REVOKE ALL ON FUNCTION public.create_billable_from_event(text, uuid, uuid, uuid, uuid, uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_billable_from_event(text, uuid, uuid, uuid, uuid, uuid, timestamptz)
  TO service_role, authenticated;

REVOKE ALL ON FUNCTION public.promote_earned_to_invoiceable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_earned_to_invoiceable(uuid)
  TO service_role, authenticated;
