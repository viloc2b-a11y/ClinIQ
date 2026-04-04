/**
 * Loads site cost profile, role rates, fee template pack, and complexity prices from Supabase.
 * Deterministic mapping to camelCase for app/runtime use (Cost Truth, expected billables, fee lookup).
 */

export type SitePricingContext = {
  siteId: string
  profile: {
    id: string
    name: string
    overheadPercent: number
    marginTarget: number
    nnnMonthly: number | null
    market: string | null
    siteType: string | null
    calibrationYear: string | null
  }
  roleCosts: Array<{
    roleCode: string
    hourlyCost: number
  }>
  feeItemsByCode: Record<
    string,
    {
      id: string
      feeCode: string
      feeName: string
      category: string
      unit: string
      trigger: string
      billing: string
      paymentTerms: string | null
      priority: string | null
      negotiationCategory: string | null
      minAcceptablePercent: number | null
      maxConcession: number | null
      pricingLow: number | null
      pricingMid: number | null
      pricingHigh: number | null
      pricingRecommended: number | null
      markupOnCost: number | null
      paymentStrategy: string | null
      justificationTemplate: string | null
      notes: string | null
      complexityAdjusted: Record<string, number>
    }
  >
}

type ProfileRow = {
  id: string
  name: string
  overhead_percent: number
  margin_target: number
  nnn_monthly: number | null
  market: string | null
  site_type: string | null
  calibration_year: string | null
}

type RoleRow = {
  role_code: string
  hourly_cost: number
}

type TemplateRow = {
  id: string
  site_id: string
  version: number
}

type ItemRow = {
  id: string
  fee_code: string
  fee_name: string
  category: string
  unit: string
  trigger?: string
  billing: string
  payment_terms: string | null
  priority: string | null
  negotiation_category: string | null
  min_acceptable_percent: number | null
  max_concession: number | null
  pricing_low: number | null
  pricing_mid: number | null
  pricing_high: number | null
  pricing_recommended: number | null
  markup_on_cost: number | null
  payment_strategy: string | null
  justification_template: string | null
  notes: string | null
}

type ComplexityRow = {
  site_fee_template_item_id: string
  therapeutic_area: string
  adjusted_price: number
}

function throwIfError(table: string, error: { message: string } | null) {
  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }
}

function mapItemRow(
  row: ItemRow,
  complexityByItemId: Map<string, Record<string, number>>,
): SitePricingContext["feeItemsByCode"][string] {
  const triggerVal =
    row.trigger ??
    (row as unknown as { Trigger?: string }).Trigger ??
    ""
  return {
    id: row.id,
    feeCode: row.fee_code,
    feeName: row.fee_name,
    category: row.category,
    unit: row.unit,
    trigger: triggerVal,
    billing: row.billing,
    paymentTerms: row.payment_terms,
    priority: row.priority,
    negotiationCategory: row.negotiation_category,
    minAcceptablePercent: row.min_acceptable_percent,
    maxConcession: row.max_concession,
    pricingLow: row.pricing_low,
    pricingMid: row.pricing_mid,
    pricingHigh: row.pricing_high,
    pricingRecommended: row.pricing_recommended,
    markupOnCost: row.markup_on_cost,
    paymentStrategy: row.payment_strategy,
    justificationTemplate: row.justification_template,
    notes: row.notes,
    complexityAdjusted: complexityByItemId.get(row.id) ?? {},
  }
}

export async function loadSitePricingContext(params: {
  supabase: any
  siteId: string
  templateVersion?: number
}): Promise<SitePricingContext> {
  const { supabase, siteId, templateVersion } = params

  const profileRes = await supabase
    .from("site_cost_profiles")
    .select(
      "id, name, overhead_percent, margin_target, nnn_monthly, market, site_type, calibration_year",
    )
    .eq("site_id", siteId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  throwIfError("site_cost_profiles", profileRes.error)
  const profileRow = profileRes.data as ProfileRow | null
  if (!profileRow) {
    throw new Error(
      `No active site_cost_profile found for site_id: ${siteId}`,
    )
  }

  const rolesRes = await supabase
    .from("role_costs")
    .select("role_code, hourly_cost")
    .eq("site_cost_profile_id", profileRow.id)

  throwIfError("role_costs", rolesRes.error)
  const roleRows = (rolesRes.data ?? []) as RoleRow[]
  const roleCosts = roleRows.map((r) => ({
    roleCode: r.role_code,
    hourlyCost: Number(r.hourly_cost),
  }))

  let templateBuilder = supabase
    .from("site_fee_templates")
    .select("id, site_id, version")
    .eq("site_id", siteId)
    .eq("is_active", true)

  if (templateVersion !== undefined) {
    templateBuilder = templateBuilder.eq("version", templateVersion)
  } else {
    templateBuilder = templateBuilder
      .order("version", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
  }

  const templateRes = await templateBuilder.maybeSingle()

  throwIfError("site_fee_templates", templateRes.error)
  const templateRow = templateRes.data as TemplateRow | null
  if (!templateRow) {
    throw new Error(`No active site_fee_template found for site_id: ${siteId}`)
  }

  const itemsRes = await supabase
    .from("site_fee_template_items")
    .select(
      "id, fee_code, fee_name, category, unit, trigger, billing, payment_terms, priority, negotiation_category, min_acceptable_percent, max_concession, pricing_low, pricing_mid, pricing_high, pricing_recommended, markup_on_cost, payment_strategy, justification_template, notes",
    )
    .eq("site_fee_template_id", templateRow.id)

  throwIfError("site_fee_template_items", itemsRes.error)
  const itemRows = (itemsRes.data ?? []) as ItemRow[]

  const complexityByItemId = new Map<string, Record<string, number>>()
  const itemIds = itemRows.map((r) => r.id)

  if (itemIds.length > 0) {
    const cxRes = await supabase
      .from("site_fee_complexity_prices")
      .select("site_fee_template_item_id, therapeutic_area, adjusted_price")
      .in("site_fee_template_item_id", itemIds)

    throwIfError("site_fee_complexity_prices", cxRes.error)
    const cxRows = (cxRes.data ?? []) as ComplexityRow[]
    for (const cx of cxRows) {
      const existing = complexityByItemId.get(cx.site_fee_template_item_id) ?? {}
      existing[cx.therapeutic_area] = Number(cx.adjusted_price)
      complexityByItemId.set(cx.site_fee_template_item_id, existing)
    }
  }

  const feeItemsByCode: SitePricingContext["feeItemsByCode"] = {}
  for (const row of itemRows) {
    feeItemsByCode[row.fee_code] = mapItemRow(row, complexityByItemId)
  }

  return {
    siteId,
    profile: {
      id: profileRow.id,
      name: profileRow.name,
      overheadPercent: Number(profileRow.overhead_percent),
      marginTarget: Number(profileRow.margin_target),
      nnnMonthly:
        profileRow.nnn_monthly == null
          ? null
          : Number(profileRow.nnn_monthly),
      market: profileRow.market,
      siteType: profileRow.site_type,
      calibrationYear: profileRow.calibration_year,
    },
    roleCosts,
    feeItemsByCode,
  }
}
