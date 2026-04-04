import { describe, expect, it } from "vitest"

import { buildArDemoScenario } from "./demo-scenario"

const AS_OF = "2026-06-15"

describe("buildArDemoScenario", () => {
  it("builds successfully with five posted invoices and derived outputs", () => {
    const r = buildArDemoScenario(AS_OF)
    expect(r.invoices).toHaveLength(5)
    expect(r.balanceRows).toHaveLength(5)
    expect(r.riskRows).toHaveLength(5)
    expect(r.queueRows).toHaveLength(5)
    expect(r.commandSummary.asOfDate).toBe(AS_OF)
    expect(r.payments).toHaveLength(4)
    expect(r.allocations).toHaveLength(4)
    expect(r.adjustments).toHaveLength(1)
  })

  it("includes all five target invoice patterns", () => {
    const { riskRows } = buildArDemoScenario(AS_OF)
    const fp = riskRows.find((x) => x.invoiceTotal === 1000)!
    const pc = riskRows.find((x) => x.invoiceTotal === 500)!
    const od = riskRows.find((x) => x.invoiceTotal === 800)!
    const sp = riskRows.find((x) => x.invoiceTotal === 600)!
    const wo = riskRows.find((x) => x.invoiceTotal === 400)!

    expect(fp.openBalance).toBe(0)
    expect(fp.status.paid).toBe(true)
    expect(fp.status.writtenOff).toBe(false)

    expect(pc.openBalance).toBe(300)
    expect(pc.status.partiallyPaid).toBe(true)
    expect(pc.status.overdue).toBe(false)
    expect(pc.status.shortPaid).toBe(false)

    expect(od.openBalance).toBe(800)
    expect(od.status.overdue).toBe(true)
    expect(od.status.shortPaid).toBe(false)

    expect(sp.openBalance).toBe(400)
    expect(sp.status.shortPaid).toBe(true)

    expect(wo.openBalance).toBe(0)
    expect(wo.status.writtenOff).toBe(true)
    expect(wo.status.paid).toBe(false)
  })

  it("command summary totals match risk row sums", () => {
    const { riskRows, commandSummary: s } = buildArDemoScenario(AS_OF)
    const sumOpen = riskRows.reduce((a, r) => a + r.openBalance, 0)
    expect(s.totalOutstandingAr).toBe(sumOpen)
    expect(s.totalHighRiskAr + s.totalMediumRiskAr + s.totalLowRiskAr).toBe(
      sumOpen,
    )
  })

  it("queue has actionable (non-monitor) rows when risk warrants", () => {
    const { queueRows } = buildArDemoScenario(AS_OF)
    const actionable = queueRows.filter((q) => q.recommendedAction !== "monitor")
    expect(actionable.length).toBeGreaterThan(0)
  })

  it("topPriorityInvoices are a prefix of queue ordered by priorityRank", () => {
    const { queueRows, commandSummary } = buildArDemoScenario(AS_OF)
    const sorted = [...queueRows].sort((a, b) => a.priorityRank - b.priorityRank)
    const top = commandSummary.topPriorityInvoices
    expect(top.length).toBeLessThanOrEqual(5)
    for (let i = 0; i < top.length; i++) {
      expect(top[i].invoiceId).toBe(sorted[i].invoiceId)
    }
    const queueIds = new Set(queueRows.map((q) => q.invoiceId))
    for (const row of top) {
      expect(queueIds.has(row.invoiceId)).toBe(true)
    }
  })

})
