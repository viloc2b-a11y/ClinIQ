import { describe, expect, it } from "vitest"

import { extractBudgetFields } from "./extractors/budget"
import { extractContractFields } from "./extractors/contract"
import { extractInvoiceFields } from "./extractors/invoice"
import { extractProtocolFields } from "./extractors/protocol"
import { evaluateProcessingStatus, processDocument } from "./intake"
import { parseFile } from "./parse-file"
import { extractDate, extractMoney, findKeywordLine } from "./utils/parsing"
import { normalizeText } from "./normalize"
import { splitLines } from "./utils/text"

const CLEAR_BUDGET = `
Study budget — Q1

Site initiation    $1,250.00
Per patient visit  1250
Monitoring fee     USD 500
Monthly overhead   $2,000

Payment terms: Net 30. Invoicing monthly.
`.trim()

describe("extractBudgetFields", () => {
  it("parses line items with $, plain decimal, and USD suffix", () => {
    const b = extractBudgetFields(CLEAR_BUDGET)
    expect(b.lineItems).toEqual([
      { description: "Site initiation", amount: 1250 },
      { description: "Per patient visit", amount: 1250 },
      { description: "Monitoring fee", amount: 500 },
      { description: "Monthly overhead", amount: 2000 },
    ])
    expect(b.paymentTerms).toBe("Net 30 days")
    expect(b.invoiceFrequency).toBe("monthly")
  })

  it("dedupes exact duplicate description + amount", () => {
    const b = extractBudgetFields("Fee A  100\nFee A  100\nFee B  200")
    expect(b.lineItems).toHaveLength(2)
  })

  it("parses dot leaders before amount", () => {
    const b = extractBudgetFields(`
Screening Visit .......... $150.00
Baseline Visit ........... $500.00
Follow-Up Visit .......... $250.00
Payment terms: Net 30
Invoices submitted monthly
`)
    expect(b.lineItems).toEqual([
      { description: "Screening Visit", amount: 150 },
      { description: "Baseline Visit", amount: 500 },
      { description: "Follow-Up Visit", amount: 250 },
    ])
    expect(b.paymentTerms).toBe("Net 30 days")
    expect(b.invoiceFrequency).toBe("monthly")
  })

  it("parses colon + currency, amount-first lines, and number-then-USD suffix", () => {
    const b = extractBudgetFields(`
Screening Visit USD 1250
Screening A: USD 1,250.50
Screening B $1250
Screening C: $1,250.75
USD 900 Baseline Visit
$400 Follow-Up Visit
Close-out fee 2,000.00 USD
`)
    expect(b.lineItems).toEqual([
      { description: "Screening Visit", amount: 1250 },
      { description: "Screening A", amount: 1250.5 },
      { description: "Screening B", amount: 1250 },
      { description: "Screening C", amount: 1250.75 },
      { description: "Baseline Visit", amount: 900 },
      { description: "Follow-Up Visit", amount: 400 },
      { description: "Close-out fee", amount: 2000 },
    ])
  })

  it("skips administrative lines for line items", () => {
    const b = extractBudgetFields(`
Site fee $500
Payment terms: Net 45
Invoice frequency: monthly
Invoices submitted on the 1st
Payable within 14 days
Terms and conditions apply
Net 60
Another line $100
`)
    expect(b.lineItems).toEqual([
      { description: "Site fee", amount: 500 },
      { description: "Another line", amount: 100 },
    ])
  })
})

describe("processDocument — budget", () => {
  it("dot-leader fee rows only → line items + missing_payment_terms + needs_review", () => {
    const r = processDocument({
      documentType: "budget",
      rawText: `
Startup Fee .......... $2500
Screen Failure ....... $100
Close-out Visit ...... $400
`,
    })
    expect(r.documentType).toBe("budget")
    expect(r.budget).toBeDefined()
    expect(r.budget!.lineItems).toEqual([
      { description: "Startup Fee", amount: 2500 },
      { description: "Screen Failure", amount: 100 },
      { description: "Close-out Visit", amount: 400 },
    ])
    expect(r.budget!.paymentTerms).toBeUndefined()
    expect(r.budget!.invoiceFrequency).toBeUndefined()
    expect(r.reviewFlags).toContain("missing_payment_terms")
    expect(r.reviewFlags).not.toContain("no_line_items_detected")
    expect(r.processingStatus).toBe("needs_review")
  })

  it("colon $ / colon USD / plain $ visit lines plus admin lines → processed", () => {
    const r = processDocument({
      documentType: "budget",
      rawText: `
Screening Visit: $150.00
Baseline Visit: USD 500.00
Follow-Up Visit $250
Payment terms: Net 30
Invoices submitted monthly
`,
    })
    expect(r.documentType).toBe("budget")
    expect(r.budget!.lineItems).toEqual([
      { description: "Screening Visit", amount: 150 },
      { description: "Baseline Visit", amount: 500 },
      { description: "Follow-Up Visit", amount: 250 },
    ])
    expect(r.budget!.paymentTerms).toBe("Net 30 days")
    expect(r.budget!.invoiceFrequency).toBe("monthly")
    expect(r.reviewFlags).toEqual([])
    expect(r.processingStatus).toBe("processed")
  })

  it("clear budget with line items and payment terms → processed when no normalize warnings", () => {
    const r = processDocument({
      documentType: "budget",
      rawText: CLEAR_BUDGET,
      fileName: "b.txt",
    })
    expect(r.documentType).toBe("budget")
    expect(r.budget!.lineItems.length).toBeGreaterThanOrEqual(4)
    expect(r.budget!.paymentTerms).toMatch(/net\s*30/i)
    expect(r.reviewFlags).not.toContain("no_line_items_detected")
    expect(r.reviewFlags).not.toContain("missing_payment_terms")
    expect(r.processingStatus).toBe("processed")
  })

  it("header + T&C + payment within + invoicing → no line items, terms + quarterly, needs_review", () => {
    const r = processDocument({
      documentType: "budget",
      rawText: `
Description Amount
Terms and Conditions
Payment within 45 days
Quarterly invoicing
`,
    })
    expect(r.documentType).toBe("budget")
    expect(r.budget!.lineItems).toEqual([])
    expect(r.budget!.paymentTerms).toBe("Payment within 45 days")
    expect(r.budget!.invoiceFrequency).toBe("quarterly")
    expect(r.reviewFlags).toContain("no_line_items_detected")
    expect(r.reviewFlags).not.toContain("missing_payment_terms")
    expect(r.processingStatus).toBe("needs_review")
  })

  it("budget with only narrative → no line items and review flags", () => {
    const r = processDocument({
      documentType: "budget",
      rawText: "Line one\nLine two",
      fileName: "b.txt",
    })
    expect(r.reviewFlags).toContain("no_line_items_detected")
    expect(r.reviewFlags).toContain("missing_payment_terms")
    expect(r.processingStatus).toBe("needs_review")
    expect(r.budget!.lineItems).toEqual([])
  })
})

describe("extractContractFields", () => {
  it("parses sponsor, payment, frequency, law, indemnification, publication", () => {
    const c = extractContractFields(`
Sponsor: Acme Pharma Inc.
Net 45
Invoices are submitted monthly.
Governing law: Delaware
The Sponsor shall indemnify the Site.
Publication of study results is permitted.
`)
    expect(c.sponsor).toBe("Acme Pharma Inc")
    expect(c.paymentTerms).toBe("Net 45 days")
    expect(c.invoiceFrequency).toBe("monthly")
    expect(c.governingLaw).toBe("Delaware")
    expect(c.indemnification).toBe(true)
    expect(c.publicationClause).toBe(true)
    expect(c.redFlags).toEqual([])
  })

  it("prefers non-site party as sponsor when agreement names site-like counterparty", () => {
    const c = extractContractFields(
      "This agreement is between Site LLC and Sponsor Corp. Net 30. Governing law: Texas.",
    )
    expect(c.sponsor).toBe("Sponsor Corp")
    expect(c.redFlags).not.toContain("ambiguous_sponsor")
    expect(c.paymentTerms).toBe("Net 30 days")
    expect(c.governingLaw).toBe("Texas")
  })

  it("first party is sponsor when both parties are non-site (deterministic fallback)", () => {
    const c = extractContractFields(
      "This agreement is between Alpha Pharma LLC and Beta Pharma Inc. Net 30. Governing law: Texas.",
    )
    expect(c.sponsor).toBe("Alpha Pharma LLC")
    expect(c.redFlags).not.toContain("ambiguous_sponsor")
  })

  it("ambiguous sponsor when both parties look site-like", () => {
    const c = extractContractFields(
      "This agreement is between City Hospital and County Medical Center. Net 30. Governing law: Texas.",
    )
    expect(c.sponsor).toBeUndefined()
    expect(c.redFlags).toContain("ambiguous_sponsor")
  })

  it("validation: ABC Pharma vs Vilo Research, Net 45, monthly, Texas, indemnify, publication", () => {
    const c = extractContractFields(`
This Agreement is between ABC Pharma and Vilo Research Group.

Payment terms: Net 45 days.
Invoices submitted monthly.

This agreement shall be governed by the laws of Texas.

The sponsor agrees to indemnify the site.

Publication of results is permitted.
`)
    expect(c.sponsor).toBe("ABC Pharma")
    expect(c.paymentTerms).toBe("Net 45 days")
    expect(c.invoiceFrequency).toBe("monthly")
    expect(c.governingLaw).toBe("Texas")
    expect(c.indemnification).toBe(true)
    expect(c.publicationClause).toBe(true)
    expect(c.redFlags).not.toContain("missing_payment_terms")
    expect(c.redFlags).not.toContain("governing_law_not_found")
    expect(c.redFlags).not.toContain("indemnification_unclear")
    expect(c.redFlags).not.toContain("publication_clause_unclear")
    expect(c.redFlags).toEqual([])
  })

  it("detects close-out invoicing and restricted publication", () => {
    const c = extractContractFields(
      "Sponsor: X. Payment within 60 days. Invoicing at close-out. The Site shall not publish results.",
    )
    expect(c.invoiceFrequency).toBe("close-out")
    expect(c.paymentTerms).toBe("Payment within 60 days")
    expect(c.publicationClause).toBe(false)
  })
})

describe("extractInvoiceFields", () => {
  it("parses sample invoice / remittance text", () => {
    const inv = extractInvoiceFields(`
Invoice #INV-00123
Bill To: ABC Pharma
Invoice Date: 03/01/2026
Due Date: 03/31/2026

Total: $1,500.00
Paid: $500.00

Reference: REM-7788
`)
    expect(inv.invoiceNumber).toBe("INV-00123")
    expect(inv.sponsor).toBe("ABC Pharma")
    expect(inv.invoiceDate).toBe("2026-03-01")
    expect(inv.dueDate).toBe("2026-03-31")
    expect(inv.totalAmount).toBe(1500)
    expect(inv.paidAmount).toBe(500)
    expect(inv.referenceNumber).toBe("REM-7788")
  })

  it("computes due date from Net X when no due line", () => {
    const inv = extractInvoiceFields(`
Invoice Date: 03/01/2026
Payment terms: Net 30
`)
    expect(inv.invoiceDate).toBe("2026-03-01")
    expect(inv.dueDate).toBe("2026-03-31")
  })

  it("parses Total Amount with USD and Inv- style number", () => {
    const inv = extractInvoiceFields(`Inv-999
Total Amount: USD 2,000.50
`)
    expect(inv.invoiceNumber).toBe("Inv-999")
    expect(inv.totalAmount).toBe(2000.5)
  })
})

describe("extractProtocolFields", () => {
  it("parses visits, procedures, studyId, billable and conditional events", () => {
    const p = extractProtocolFields(`
Protocol: ABC-123

Screening Visit
Blood draw
ECG

Baseline Visit
Physical exam
MRI scan

Week 4 Visit
Lab test if needed
`)
    expect(p.studyId).toBe("ABC-123")
    expect(p.visits).toEqual([
      { name: "Screening Visit", procedures: ["Blood draw", "ECG"] },
      { name: "Baseline Visit", procedures: ["Physical exam", "MRI scan"] },
      { name: "Week 4 Visit", procedures: ["Lab test if needed"] },
    ])
    expect(p.billableEvents).toEqual([
      "Blood draw",
      "ECG",
      "Physical exam",
      "MRI scan",
      "Lab test if needed",
    ])
    expect(p.conditionalEvents).toEqual(["Lab test if needed"])
  })
})

describe("processDocument — invoice", () => {
  it("runs invoice extractor and processes", () => {
    const r = processDocument({
      documentType: "invoice",
      rawText: "Invoice #X\nTotal: $10",
    })
    expect(r.documentType).toBe("invoice")
    expect(r.invoice!.invoiceNumber).toBe("X")
    expect(r.invoice!.totalAmount).toBe(10)
    expect(r.processingStatus).toBe("processed")
  })
})

describe("processDocument — contract", () => {
  it("rich contract → processed without insufficient flag", () => {
    const r = processDocument({
      documentType: "contract",
      rawText: `
Sponsor: Acme Pharma Inc.
Net 45
Invoices are submitted monthly.
Governing law: Delaware
The Sponsor shall indemnify the Site.
Publication of study results is permitted.
`,
    })
    expect(r.documentType).toBe("contract")
    expect(r.contract!.redFlags).toEqual([])
    expect(r.reviewFlags).toEqual([])
    expect(r.processingStatus).toBe("processed")
  })

  it("thin contract merges extractor redFlags into reviewFlags", () => {
    const r = processDocument({
      documentType: "contract",
      rawText: "hello world xx",
    })
    expect(r.contract!.redFlags.length).toBeGreaterThan(0)
    expect(r.reviewFlags).toEqual(r.contract!.redFlags)
  })
})

describe("processDocument — each type processed when clean", () => {
  it("budget → processed", () => {
    const r = processDocument({ documentType: "budget", rawText: CLEAR_BUDGET })
    expect(r.processingStatus).toBe("processed")
    expect(r.reviewFlags).toEqual([])
    expect(r.budget).toBeDefined()
  })

  it("contract → processed", () => {
    const r = processDocument({
      documentType: "contract",
      rawText: `Sponsor: Acme Co
Net 30
Governing law: Delaware
The sponsor shall indemnify the site.
Publication of results is permitted.`,
    })
    expect(r.processingStatus).toBe("processed")
    expect(r.reviewFlags).toEqual([])
    expect(r.contract).toBeDefined()
  })

  it("invoice → processed", () => {
    const r = processDocument({
      documentType: "invoice",
      rawText: "Invoice #INV-1\nTotal: $100.00",
    })
    expect(r.processingStatus).toBe("processed")
    expect(r.reviewFlags).toEqual([])
    expect(r.invoice).toBeDefined()
  })

  it("protocol → processed", () => {
    const r = processDocument({
      documentType: "protocol",
      rawText: "Protocol: SOA-1\n\nScreening Visit\nBlood draw",
    })
    expect(r.processingStatus).toBe("processed")
    expect(r.reviewFlags).toEqual([])
    expect(r.protocol!.studyId).toBe("SOA-1")
    expect(r.protocol!.visits).toEqual([{ name: "Screening Visit", procedures: ["Blood draw"] }])
  })
})

describe("processDocument — normalize", () => {
  it("maps empty input to needs_review and normalize flags", () => {
    const r = processDocument({
      documentType: "budget",
      rawText: "   \n\t  ",
    })
    expect(r.parsed.parseWarnings).toContain("empty_input")
    expect(r.reviewFlags).toContain("normalize_empty_input")
    expect(r.processingStatus).toBe("needs_review")
  })
})

describe("parseFile", () => {
  it("returns ParsedFilePayload with normalized text", () => {
    const p = parseFile({ rawText: "  a  \n  b  " })
    expect(p.normalizedText).toBe("a\nb")
    expect(p.lineCount).toBe(2)
  })
})

describe("evaluateProcessingStatus", () => {
  it("processed when no empty_input and no review flags", () => {
    const parsed = parseFile({ rawText: "hello world enough" })
    expect(evaluateProcessingStatus(parsed, [])).toBe("processed")
  })
})

describe("utils/parsing", () => {
  it("extractMoney finds first amount", () => {
    expect(extractMoney("Fee $1,234.50 USD")).toBe(1234.5)
    expect(extractMoney("no money")).toBeUndefined()
  })

  it("extractDate normalizes ISO and US", () => {
    expect(extractDate("Start 2026-01-05 end")).toBe("2026-01-05")
    expect(extractDate("on 3/4/2026 here")).toBe("2026-03-04")
  })

  it("findKeywordLine is deterministic", () => {
    const lines = splitLines("alpha\nPayment Terms: Net 30\ngamma")
    expect(findKeywordLine(lines, ["payment", "terms"])).toBe(1)
    expect(findKeywordLine(lines, ["missing"])).toBe(-1)
  })
})

describe("normalizeText", () => {
  it("preserves line count after trim", () => {
    const { normalizedText, parseWarnings } = normalizeText("x\ny\n")
    expect(normalizedText).toBe("x\ny")
    expect(parseWarnings).not.toContain("empty_input")
  })
})
