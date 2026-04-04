import type { InvoiceLine, InvoicePackage } from "../claims/types"
import type { ArLedgerInput } from "./balances"
import type {
  ArAgingRow,
  ArCommandSummary,
  BalanceAdjustment,
  CollectionsActionRow,
  InvoiceBalanceRow,
  InvoiceRiskRow,
  PaymentAllocation,
  PostedInvoice,
  SponsorPayment,
} from "./types"
import { buildArCommandSummary } from "./command-summary"
import { buildCollectionsActionQueue } from "./collections-queue"
import { postInvoiceFromPackage } from "./post-invoice"
import { buildArAgingByDueDate, buildInvoiceBalanceView } from "./reports"
import { buildInvoiceRiskView } from "./risk-view"

const DEMO_STUDY = "ar-demo-study"
const DEMO_SPONSOR = "ar-demo-sponsor"

function demoLine(
  lineId: string,
  claimItemId: string,
  amount: number,
  eventDate: string,
  label: string,
): InvoiceLine {
  return {
    id: lineId,
    studyId: DEMO_STUDY,
    sponsorId: DEMO_SPONSOR,
    eventDate,
    lineCode: "DEMO",
    label,
    amount,
    status: "ready",
    claimItemId,
  }
}

function demoPackage(
  generatedAt: string,
  line: InvoiceLine,
  subtotal: number,
): InvoicePackage {
  return {
    schemaVersion: "1.0",
    studyId: DEMO_STUDY,
    sponsorId: DEMO_SPONSOR,
    invoicePeriodStart: "2026-01-01",
    invoicePeriodEnd: "2026-03-31",
    generatedAt,
    lines: [line],
    subtotal,
    lineCount: 1,
    hasBlockingIssues: false,
  }
}

export type ArDemoScenarioResult = {
  invoices: PostedInvoice[]
  payments: SponsorPayment[]
  allocations: PaymentAllocation[]
  adjustments: BalanceAdjustment[]
  balanceRows: InvoiceBalanceRow[]
  agingRows: ArAgingRow[]
  riskRows: InvoiceRiskRow[]
  queueRows: CollectionsActionRow[]
  commandSummary: ArCommandSummary
}

/**
 * Deterministic in-memory demo: post invoices → balance/aging → risk → collections queue → command summary.
 * Uses only public AR builders (no shortcuts).
 */
export function buildArDemoScenario(asOfDate: string): ArDemoScenarioResult {
  const packages: InvoicePackage[] = [
    demoPackage(
      "2026-01-01T10:00:00.000Z",
      demoLine("il-fp", "ci-demo-fp", 1000, "2026-02-01", "Demo — fully paid"),
      1000,
    ),
    demoPackage(
      "2026-01-02T10:00:00.000Z",
      demoLine("il-pc", "ci-demo-pc", 500, "2026-02-05", "Demo — partial, current"),
      500,
    ),
    demoPackage(
      "2026-01-03T10:00:00.000Z",
      demoLine("il-od", "ci-demo-od", 800, "2026-02-10", "Demo — overdue open"),
      800,
    ),
    demoPackage(
      "2026-01-04T10:00:00.000Z",
      demoLine("il-sp", "ci-demo-sp", 600, "2026-02-12", "Demo — short-paid"),
      600,
    ),
    demoPackage(
      "2026-01-05T10:00:00.000Z",
      demoLine("il-wo", "ci-demo-wo", 400, "2026-02-15", "Demo — write-off close"),
      400,
    ),
  ]

  const dueDates = [
    "2026-05-31",
    "2026-09-01",
    "2026-04-01",
    "2026-05-01",
    "2026-05-15",
  ]

  const posted = packages.map((pkg, i) =>
    postInvoiceFromPackage(pkg, { dueDate: dueDates[i] }),
  )

  const payments: SponsorPayment[] = [
    {
      paymentId: "pay_demo_fp",
      sponsorId: DEMO_SPONSOR,
      amount: 1000,
      paymentDate: "2026-06-01",
    },
    {
      paymentId: "pay_demo_pc",
      sponsorId: DEMO_SPONSOR,
      amount: 200,
      paymentDate: "2026-06-02",
    },
    {
      paymentId: "pay_demo_sp",
      sponsorId: DEMO_SPONSOR,
      amount: 200,
      paymentDate: "2026-06-03",
    },
    {
      paymentId: "pay_demo_wo",
      sponsorId: DEMO_SPONSOR,
      amount: 100,
      paymentDate: "2026-06-04",
    },
  ]

  const allocations: PaymentAllocation[] = [
    {
      allocationId: "alloc_demo_fp",
      paymentId: "pay_demo_fp",
      invoiceId: posted[0].invoiceId,
      amount: 1000,
    },
    {
      allocationId: "alloc_demo_pc",
      paymentId: "pay_demo_pc",
      invoiceId: posted[1].invoiceId,
      amount: 200,
    },
    {
      allocationId: "alloc_demo_sp",
      paymentId: "pay_demo_sp",
      invoiceId: posted[3].invoiceId,
      amount: 200,
    },
    {
      allocationId: "alloc_demo_wo",
      paymentId: "pay_demo_wo",
      invoiceId: posted[4].invoiceId,
      amount: 100,
    },
  ]

  const adjustments: BalanceAdjustment[] = [
    {
      adjustmentId: "adj_demo_wo",
      type: "write_off",
      invoiceId: posted[4].invoiceId,
      amount: 300,
      reason: "demo write-off",
      createdAt: "2026-06-10T12:00:00Z",
    },
  ]

  const ledger: ArLedgerInput = {
    invoices: posted,
    payments,
    allocations,
    adjustments,
  }

  const balanceRows = buildInvoiceBalanceView(ledger, asOfDate)
  const agingRows = buildArAgingByDueDate(ledger, asOfDate)
  const riskRows = buildInvoiceRiskView({
    invoices: posted,
    balances: balanceRows,
    aging: agingRows,
    asOfDate,
    allocations,
    payments,
  })
  const queueRows = buildCollectionsActionQueue({ riskRows })
  const commandSummary = buildArCommandSummary({
    asOfDate,
    riskRows,
    queueRows,
  })

  return {
    invoices: posted,
    payments,
    allocations,
    adjustments,
    balanceRows,
    agingRows,
    riskRows,
    queueRows,
    commandSummary,
  }
}
