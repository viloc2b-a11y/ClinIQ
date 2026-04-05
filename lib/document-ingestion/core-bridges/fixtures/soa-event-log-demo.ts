/**
 * Document Engine v1 — SoA + invoice fixtures for SoA → event-log schema candidate demo.
 *
 * Same deterministic scenario as {@link ./soa-revenue-protection-demo}:
 * - Screening / Consent ↔ exact match
 * - Day 7 / Lab Panel ↔ unit price mismatch (invoice total aligned to expected total)
 * - Day 1 / Physical Exam → unmatched expected
 * - Unscheduled / Travel Reimbursement → unmatched invoice
 */

export { demoInvoiceRows, demoSoaImportRows } from "./soa-revenue-protection-demo"
