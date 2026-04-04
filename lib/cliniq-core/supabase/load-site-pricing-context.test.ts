import { describe, expect, it, vi } from "vitest"

import {
  loadSitePricingContext,
  type SitePricingContext,
} from "./load-site-pricing-context"

const profileRow = {
  id: "p1",
  name: "Test Profile",
  overhead_percent: 0.32,
  margin_target: 0.2,
  nnn_monthly: 4200,
  market: "Houston/Texas",
  site_type: "small_independent",
  calibration_year: "2025-2026",
}

const roleRows = [
  { role_code: "CRC", hourly_cost: 82.5 },
  { role_code: "PI", hourly_cost: 185 },
]

function chainArray(result: {
  data: unknown
  error: null
} | { data: null; error: { message: string } }) {
  return {
    select: () => ({
      eq: async () => result,
    }),
  }
}

function profileChain(result: {
  data: unknown
  error: { message: string } | null
}) {
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: async () => result,
            }),
          }),
        }),
      }),
    }),
  }
}

function templateChainNoVersion(data: unknown, error: { message: string } | null = null) {
  const result = { data, error }
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          order: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => result,
              }),
            }),
          }),
        }),
      }),
    }),
  }
}

function templateChainWithVersion(data: unknown, error: { message: string } | null = null) {
  const r = { data, error }
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => r,
          }),
        }),
      }),
    }),
  }
}

describe("loadSitePricingContext", () => {
  it("loads active profile, role costs, template, items, and complexity prices", async () => {
    const itemA = {
      id: "i1",
      fee_code: "PP-SCR-001",
      fee_name: "Screening",
      category: "PerPatient",
      unit: "Visit",
      trigger: "screening_visit_completed",
      billing: "monthly",
      payment_terms: "Net-30",
      priority: "must_win",
      negotiation_category: "MustWin",
      min_acceptable_percent: 0.9,
      max_concession: 0.1,
      pricing_low: 380,
      pricing_mid: 520,
      pricing_high: 680,
      pricing_recommended: 520,
      markup_on_cost: null,
      payment_strategy: "Monthly",
      justification_template: "J",
      notes: "N",
    }
    const complexityRows = [
      {
        site_fee_template_item_id: "i1",
        therapeutic_area: "diabetes",
        adjusted_price: 520,
      },
    ]

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "site_cost_profiles") {
          return profileChain({ data: profileRow, error: null })
        }
        if (table === "role_costs") {
          return chainArray({ data: roleRows, error: null })
        }
        if (table === "site_fee_templates") {
          return templateChainNoVersion({ id: "t1", site_id: "S", version: 1 })
        }
        if (table === "site_fee_template_items") {
          return chainArray({ data: [itemA], error: null })
        }
        if (table === "site_fee_complexity_prices") {
          return {
            select: () => ({
              in: async () => ({ data: complexityRows, error: null }),
            }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      }),
    }

    const ctx = await loadSitePricingContext({
      supabase,
      siteId: "VILO-KATY-001",
    })

    expect(ctx.siteId).toBe("VILO-KATY-001")
    expect(ctx.profile.overheadPercent).toBe(0.32)
    expect(ctx.roleCosts).toHaveLength(2)
    expect(ctx.roleCosts[0].roleCode).toBe("CRC")
    expect(ctx.feeItemsByCode["PP-SCR-001"]).toBeDefined()
    expect(ctx.feeItemsByCode["PP-SCR-001"].complexityAdjusted.diabetes).toBe(520)
    expect(ctx.feeItemsByCode["PP-SCR-001"].trigger).toBe(
      "screening_visit_completed",
    )
  })

  it("picks highest active template version when templateVersion not provided", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "site_cost_profiles") {
          return profileChain({ data: profileRow, error: null })
        }
        if (table === "role_costs") {
          return chainArray({ data: [], error: null })
        }
        if (table === "site_fee_templates") {
          return templateChainNoVersion({
            id: "t-high",
            site_id: "VILO-KATY-001",
            version: 3,
          })
        }
        if (table === "site_fee_template_items") {
          return chainArray({ data: [], error: null })
        }
        throw new Error(table)
      }),
    }

    const ctx = await loadSitePricingContext({
      supabase,
      siteId: "VILO-KATY-001",
    })

    expect(supabase.from).toHaveBeenCalledWith("site_fee_templates")
    expect(ctx.feeItemsByCode).toEqual({})
  })

  it("respects templateVersion when provided", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "site_cost_profiles") {
          return profileChain({ data: profileRow, error: null })
        }
        if (table === "role_costs") {
          return chainArray({ data: [], error: null })
        }
        if (table === "site_fee_templates") {
          return templateChainWithVersion({
            id: "t-v1",
            site_id: "VILO-KATY-001",
            version: 1,
          })
        }
        if (table === "site_fee_template_items") {
          return chainArray({ data: [], error: null })
        }
        throw new Error(table)
      }),
    }

    await loadSitePricingContext({
      supabase,
      siteId: "VILO-KATY-001",
      templateVersion: 1,
    })

    expect(supabase.from).toHaveBeenCalledWith("site_fee_templates")
  })

  it("throws when no active profile exists", async () => {
    const supabase = {
      from: vi.fn(() =>
        profileChain({ data: null, error: null }),
      ),
    }

    await expect(
      loadSitePricingContext({ supabase, siteId: "MISSING" }),
    ).rejects.toThrow(
      "No active site_cost_profile found for site_id: MISSING",
    )
  })

  it("throws when no active template exists", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "site_cost_profiles") {
          return profileChain({ data: profileRow, error: null })
        }
        if (table === "role_costs") {
          return chainArray({ data: [], error: null })
        }
        if (table === "site_fee_templates") {
          return templateChainNoVersion(null)
        }
        throw new Error(table)
      }),
    }

    await expect(
      loadSitePricingContext({ supabase, siteId: "VILO-KATY-001" }),
    ).rejects.toThrow(
      "No active site_fee_template found for site_id: VILO-KATY-001",
    )
  })

  it("returns empty complexityAdjusted when a fee has no complexity rows", async () => {
    const itemA = {
      id: "i-plain",
      fee_code: "SF-START-001",
      fee_name: "Startup",
      category: "Startup",
      unit: "OneTime",
      trigger: "CTA_fully_executed",
      billing: "immediate",
      payment_terms: null,
      priority: null,
      negotiation_category: null,
      min_acceptable_percent: null,
      max_concession: null,
      pricing_low: null,
      pricing_mid: null,
      pricing_high: null,
      pricing_recommended: 6200,
      markup_on_cost: null,
      payment_strategy: null,
      justification_template: null,
      notes: null,
    }

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "site_cost_profiles") {
          return profileChain({ data: profileRow, error: null })
        }
        if (table === "role_costs") {
          return chainArray({ data: [], error: null })
        }
        if (table === "site_fee_templates") {
          return templateChainNoVersion({ id: "t1", site_id: "S", version: 1 })
        }
        if (table === "site_fee_template_items") {
          return chainArray({ data: [itemA], error: null })
        }
        if (table === "site_fee_complexity_prices") {
          return {
            select: () => ({
              in: async () => ({ data: [], error: null }),
            }),
          }
        }
        throw new Error(table)
      }),
    }

    const ctx = await loadSitePricingContext({
      supabase,
      siteId: "VILO-KATY-001",
    })

    expect(ctx.feeItemsByCode["SF-START-001"].complexityAdjusted).toEqual({})
  })

  it("feeItemsByCode is keyed by feeCode", async () => {
    const items = [
      {
        id: "a",
        fee_code: "A-001",
        fee_name: "A",
        category: "c",
        unit: "u",
        trigger: "t",
        billing: "b",
        payment_terms: null,
        priority: null,
        negotiation_category: null,
        min_acceptable_percent: null,
        max_concession: null,
        pricing_low: null,
        pricing_mid: null,
        pricing_high: null,
        pricing_recommended: null,
        markup_on_cost: null,
        payment_strategy: null,
        justification_template: null,
        notes: null,
      },
      {
        id: "b",
        fee_code: "B-002",
        fee_name: "B",
        category: "c",
        unit: "u",
        trigger: "t",
        billing: "b",
        payment_terms: null,
        priority: null,
        negotiation_category: null,
        min_acceptable_percent: null,
        max_concession: null,
        pricing_low: null,
        pricing_mid: null,
        pricing_high: null,
        pricing_recommended: null,
        markup_on_cost: null,
        payment_strategy: null,
        justification_template: null,
        notes: null,
      },
    ]

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "site_cost_profiles") {
          return profileChain({ data: profileRow, error: null })
        }
        if (table === "role_costs") {
          return chainArray({ data: [], error: null })
        }
        if (table === "site_fee_templates") {
          return templateChainNoVersion({ id: "t1", site_id: "S", version: 1 })
        }
        if (table === "site_fee_template_items") {
          return chainArray({ data: items, error: null })
        }
        if (table === "site_fee_complexity_prices") {
          return {
            select: () => ({
              in: async () => ({ data: [], error: null }),
            }),
          }
        }
        throw new Error(table)
      }),
    }

    const ctx: SitePricingContext = await loadSitePricingContext({
      supabase,
      siteId: "X",
    })

    expect(Object.keys(ctx.feeItemsByCode).sort()).toEqual(["A-001", "B-002"])
    expect(ctx.feeItemsByCode["A-001"].feeCode).toBe("A-001")
  })

  it("throws with table prefix when Supabase returns error", async () => {
    const supabase = {
      from: vi.fn(() =>
        profileChain({
          data: null,
          error: { message: "connection failed" },
        }),
      ),
    }

    await expect(
      loadSitePricingContext({ supabase, siteId: "X" }),
    ).rejects.toThrow("site_cost_profiles: connection failed")
  })
})
