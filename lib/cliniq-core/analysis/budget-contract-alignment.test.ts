import { describe, expect, it } from "vitest"

import { analyzeBudgetContractAlignment } from "./budget-contract-alignment"

describe("analyzeBudgetContractAlignment", () => {
  it("Net 30 monthly budget vs Net 45 monthly contract → payment_terms_mismatch high only", () => {
    const result = analyzeBudgetContractAlignment({
      budget: {
        lineItems: [],
        paymentTerms: "Net 30",
        invoiceFrequency: "monthly",
      },
      contract: {
        paymentTerms: "Net 45",
        invoiceFrequency: "monthly",
        redFlags: [],
      },
    })

    expect(result.issues).toHaveLength(1)
    expect(result.issues[0]).toMatchObject({
      type: "payment_terms_mismatch",
      severity: "high",
    })
    expect(result.issues[0].message).toContain("Net 30")
    expect(result.issues[0].message).toContain("Net 45")
    expect(result.summary).toEqual({ totalIssues: 1, criticalIssues: 1 })
    expect(result.recommendations).toHaveLength(1)
    expect(result.recommendations[0].negotiationText).toBeDefined()
    expect(result.recommendations[0].justification).toBeDefined()
    expect(result.recommendations[0].estimatedImpact?.days).toBe(15)
    expect(result.recommendations[0].negotiationText).toContain("15-day delay")
    expect(result.recommendations[0]).toEqual({
      action: "Negotiate payment terms from Net 45 to Net 30",
      priority: "high",
      impact: "cash_flow",
      justification:
        "Extended payment terms negatively impact site cash flow and operational sustainability.",
      negotiationText:
        "We propose aligning payment terms to Net 30 days to ensure operational sustainability and consistent study execution. This represents an estimated 15-day delay in cash flow.",
      estimatedImpact: { type: "cash_flow_delay", days: 15 },
    })
  })

  it("payment delay with lineItems → estimatedValue from budget / 30 * delay; negotiation includes dollar amount", () => {
    const result = analyzeBudgetContractAlignment({
      budget: {
        lineItems: [
          { description: "Item A", amount: 10_000 },
          { description: "Item B", amount: 5_000 },
        ],
        paymentTerms: "Net 30",
        invoiceFrequency: "monthly",
      },
      contract: {
        paymentTerms: "Net 45",
        invoiceFrequency: "monthly",
        redFlags: [],
      },
    })
    expect(result.recommendations[0].estimatedImpact?.days).toBe(15)
    expect(result.recommendations[0].estimatedImpact?.estimatedValue).toBe(7500)
    expect(result.recommendations[0].negotiationText).toContain("$7500")
    expect(result.recommendations[0].negotiationText).toContain("15-day delay")
  })

  it("Budget Net 30 vs Contract Net 45 → one payment mismatch issue and one negotiate recommendation", () => {
    const result = analyzeBudgetContractAlignment({
      budget: { lineItems: [], paymentTerms: "Net 30", invoiceFrequency: "monthly" },
      contract: {
        paymentTerms: "Net 45",
        invoiceFrequency: "monthly",
        redFlags: [],
      },
    })
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].type).toBe("payment_terms_mismatch")
    expect(result.recommendations).toHaveLength(1)
    expect(result.recommendations[0].action).toBe(
      "Negotiate payment terms from Net 45 to Net 30",
    )
    expect(result.recommendations[0].negotiationText).toBeDefined()
    expect(result.recommendations[0].justification).toBeDefined()
    expect(result.recommendations[0].estimatedImpact?.days).toBe(15)
    expect(result.recommendations[0].negotiationText).toContain("15-day delay")
  })

  it("missing contract payment terms → high", () => {
    const result = analyzeBudgetContractAlignment({
      budget: { lineItems: [], paymentTerms: "Net 30" },
      contract: { redFlags: [] },
    })
    expect(result.issues.some((i) => i.type === "missing_contract_payment_terms")).toBe(true)
    expect(result.issues.find((i) => i.type === "missing_contract_payment_terms")!.severity).toBe(
      "high",
    )
    expect(result.recommendations.some((r) => r.action.startsWith("Add explicit payment terms"))).toBe(
      true,
    )
  })

  it("missing contract invoice frequency → medium", () => {
    const result = analyzeBudgetContractAlignment({
      budget: { lineItems: [], invoiceFrequency: "monthly" },
      contract: { paymentTerms: "Net 30", redFlags: [] },
    })
    const m = result.issues.find((i) => i.type === "missing_contract_invoice_frequency")
    expect(m?.severity).toBe("medium")
  })

  it("redFlags missing_payment_terms with terms present → high flag issue", () => {
    const result = analyzeBudgetContractAlignment({
      budget: { lineItems: [] },
      contract: { paymentTerms: "Net 30", redFlags: ["missing_payment_terms"] },
    })
    expect(
      result.issues.some((i) => i.type === "contract_red_flag_missing_payment_terms"),
    ).toBe(true)
  })

  it("budget longer net than contract → payment_terms_mismatch medium", () => {
    const result = analyzeBudgetContractAlignment({
      budget: { lineItems: [], paymentTerms: "Net 60 days", invoiceFrequency: "monthly" },
      contract: { paymentTerms: "Net 30 days", invoiceFrequency: "monthly", redFlags: [] },
    })
    const p = result.issues.find((i) => i.type === "payment_terms_mismatch")
    expect(p?.severity).toBe("medium")
    expect(result.recommendations).toHaveLength(0)
  })

  it("deterministic ordering: high before medium, then type", () => {
    const result = analyzeBudgetContractAlignment({
      budget: {
        lineItems: [],
        paymentTerms: "Net 30",
        invoiceFrequency: "monthly",
      },
      contract: {
        paymentTerms: "Net 45",
        invoiceFrequency: "quarterly",
        redFlags: [],
      },
    })
    const types = result.issues.map((i) => i.type)
    const paymentIdx = types.indexOf("payment_terms_mismatch")
    const freqIdx = types.indexOf("invoice_frequency_mismatch")
    expect(paymentIdx).toBeLessThan(freqIdx)
    expect(result.issues[0].severity).toBe("high")
    expect(result.recommendations[0].priority).toBe("high")
    expect(result.recommendations[1].priority).toBe("medium")
  })

  it("contract redFlags indemnification_unclear and publication_clause_unclear → risk recommendations", () => {
    const result = analyzeBudgetContractAlignment({
      budget: { lineItems: [] },
      contract: {
        paymentTerms: "Net 30",
        invoiceFrequency: "monthly",
        redFlags: ["publication_clause_unclear", "indemnification_unclear"],
      },
    })
    const actions = result.recommendations.map((r) => r.action).sort()
    expect(actions).toContain("Clarify indemnification clause")
    expect(actions).toContain("Clarify publication rights")
    expect(
      result.recommendations.filter((r) => r.impact === "risk").every((r) => r.priority === "medium"),
    ).toBe(true)
  })
})
