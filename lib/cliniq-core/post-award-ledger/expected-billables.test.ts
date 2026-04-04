import { describe, expect, it } from "vitest"

import { CLINIQ_DEFAULT_PAYLOADS } from "../api/test-cost-client"
import type { InternalBudgetLine } from "../budget-gap/types"
import { calculateProcedureCost } from "../cost-truth/cost-engine"
import { applyMargin, applyOverhead } from "../cost-truth/cost-rules"
import { generateExpectedBillablesFromBudget } from "./expected-billables"

function baseLine(overrides: Partial<InternalBudgetLine>): InternalBudgetLine {
  return {
    id: "b-x",
    category: "Visit",
    lineCode: "VX",
    label: "Test line",
    visitName: "V1",
    quantity: 2,
    unit: "ea",
    internalUnitCost: 100,
    internalTotal: 220,
    notes: "",
    source: "internal-model",
    ...overrides,
  }
}

describe("generateExpectedBillablesFromBudget", () => {
  it("uses CLINIQ_DEFAULT_PAYLOADS[line.lineCode] Cost Truth (price_with_margin × qty) when fee code matches", () => {
    const payload = CLINIQ_DEFAULT_PAYLOADS["PP-SCR-001"]!
    const breakdown = calculateProcedureCost(
      payload.procedure,
      payload.roleCosts,
      payload.siteCostProfile,
    )
    const line = baseLine({
      id: "b-scr",
      lineCode: "PP-SCR-001",
      label: "Screening Visit (V1)",
      quantity: 2,
      internalUnitCost: 1,
      internalTotal: 2,
    })
    const exp = generateExpectedBillablesFromBudget([line], { studyId: "S-pack" })
    expect(exp).toHaveLength(1)
    expect(exp[0].unitPrice).toBe(breakdown.price_with_margin)
    expect(exp[0].expectedRevenue).toBe(breakdown.price_with_margin * 2)
  })

  it("legacy path: internalTotal and internalTotal/qty unit price when no cost options", () => {
    const lines: InternalBudgetLine[] = [
      baseLine({
        id: "b1",
        lineCode: "SU",
        quantity: 1,
        internalUnitCost: 8000,
        internalTotal: 8000,
      }),
      baseLine({
        id: "b2",
        lineCode: "V1",
        quantity: 4,
        internalUnitCost: 250,
        internalTotal: 1000,
      }),
    ]
    const exp = generateExpectedBillablesFromBudget(lines, { studyId: "S-1" })
    expect(exp).toHaveLength(2)
    expect(exp[0].unitPrice).toBe(8000)
    expect(exp[0].expectedRevenue).toBe(8000)
    expect(exp[1].unitPrice).toBe(250)
    expect(exp[1].expectedRevenue).toBe(1000)
    expect(exp.every((e) => e.studyId === "S-1")).toBe(true)
  })

  it("internal unit cost path: complexity × internalUnitCost, then overhead and margin when site profile provided", () => {
    const line = baseLine({
      id: "b-int",
      quantity: 10,
      internalUnitCost: 50,
      internalTotal: 500,
    })
    const siteCostProfile = {
      overhead_percent: 0.25,
      margin_target: 0.2,
    }
    const exp = generateExpectedBillablesFromBudget([line], {
      studyId: "S-2",
      siteCostProfile,
      complexityMultiplier: 2,
    })
    expect(exp).toHaveLength(1)
    let unit = 50 * 2
    unit = applyMargin(applyOverhead(unit, 0.25), 0.2)
    expect(exp[0].unitPrice).toBe(unit)
    expect(exp[0].expectedRevenue).toBe(unit * 10)
  })

  it("internal unit cost path: complexity only (no site profile) scales unit price", () => {
    const line = baseLine({
      id: "b-mul",
      quantity: 3,
      internalUnitCost: 40,
      internalTotal: 120,
    })
    const exp = generateExpectedBillablesFromBudget([line], {
      complexityMultiplier: 1.5,
    })
    expect(exp[0].unitPrice).toBe(60)
    expect(exp[0].expectedRevenue).toBe(180)
  })

  it("Cost Truth path: procedure + roleCosts + siteCostProfile yields engine price_with_margin × qty", () => {
    const procedure = {
      id: "proc-v1",
      name: "On-site visit",
      times: [{ role_code: "CRC", minutes: 30 }],
    }
    const line = baseLine({
      id: "b-ct",
      quantity: 2,
      internalUnitCost: 999,
      internalTotal: 1998,
      costTruthProcedure: procedure,
    })
    const roleCosts = [{ role_code: "CRC", hourly_cost: 200 }]
    const siteCostProfile = { overhead_percent: 0, margin_target: 0 }
    const breakdown = calculateProcedureCost(
      procedure,
      roleCosts,
      siteCostProfile,
    )
    const exp = generateExpectedBillablesFromBudget([line], {
      studyId: "S-ct",
      roleCosts,
      siteCostProfile,
      complexityMultiplier: 9,
    })
    expect(exp).toHaveLength(1)
    expect(exp[0].unitPrice).toBe(breakdown.price_with_margin)
    expect(exp[0].expectedRevenue).toBe(breakdown.price_with_margin * 2)
  })

  it("Cost Truth path takes priority over internal cost path when both apply", () => {
    const procedure = {
      id: "p2",
      name: "Proc",
      times: [{ role_code: "PI", minutes: 60 }],
    }
    const line = baseLine({
      id: "b-pri",
      quantity: 1,
      internalUnitCost: 10,
      internalTotal: 10,
      costTruthProcedure: procedure,
    })
    const roleCosts = [{ role_code: "PI", hourly_cost: 300 }]
    const siteCostProfile = { overhead_percent: 0.1, margin_target: 0.1 }
    const breakdown = calculateProcedureCost(
      procedure,
      roleCosts,
      siteCostProfile,
    )
    const exp = generateExpectedBillablesFromBudget([line], {
      roleCosts,
      siteCostProfile,
      complexityMultiplier: 100,
    })
    expect(exp[0].unitPrice).toBe(breakdown.price_with_margin)
    expect(exp[0].expectedRevenue).toBe(breakdown.price_with_margin)
  })
})
