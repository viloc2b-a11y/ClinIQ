import { describe, expect, it } from "vitest"
import { buildSponsorArgumentBundle } from "./sponsor-arguments"

describe("buildSponsorArgumentBundle", () => {
  it("classifies ECG underpayment with sponsor reference tone", () => {
    const b = buildSponsorArgumentBundle({
      label: "12-lead ECG",
      line_code: "ECG1",
      category: "Procedure",
      visit_name: "Visit 2",
      current_price: 75,
      internal_cost: 150,
      proposed_price: 150,
    })
    expect(b.issue_type).toBe("underpayment")
    expect(b.sponsor_language).toMatch(/ECG|ecg|rate/i)
  })

  it("classifies lab handling as missing line", () => {
    const b = buildSponsorArgumentBundle({
      label: "Lab specimen packaging",
      line_code: "LAB",
      category: "Lab",
      visit_name: "Visit 1",
      current_price: 0,
      internal_cost: 200,
      proposed_price: 50,
    })
    expect(b.issue_type).toBe("missing_line")
    expect(b.sponsor_language).toMatch(/sample|lab|handling/i)
  })

  it("classifies payment terms", () => {
    const b = buildSponsorArgumentBundle({
      label: "Payment terms net 90",
      line_code: "PAY",
      category: "Admin",
      visit_name: "N/A",
      current_price: 0,
      internal_cost: 0,
      proposed_price: 0,
    })
    expect(b.issue_type).toBe("payment_timing")
    expect(b.sponsor_language).toMatch(/payment|cash flow/i)
  })
})
