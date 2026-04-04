# ClinIQ: Billing-to-Cash Overview (Post-Award Revenue Protection)

This document describes how ClinIQ connects **execution facts** to **cash and collections visibility**—without replacing your EDC, CTMS, or general ledger.

---

## Upstream flow (plain English)

1. **Work happens** — visits, procedures, and billable activity occur on a study.
2. **Execution and budget lines** — ClinIQ’s post-award layer turns what was *done* into structured, fee-aligned billable lines (what should be invoiced, under which rules).
3. **Claims and invoice package (Module 5)** — Those lines roll into claim-ready items and an **invoice package**: a sponsor-facing invoice picture with line-level traceability (including linkage back to claim items).
4. **Posted invoice and cash application (Module 6)** — When finance treats that package as issued, ClinIQ can **post** a stable invoice record, record **payments** and **allocations**, apply **write-offs**, and compute **open balances**, **aging**, and **AR status**—using explicit, repeatable rules.
5. **Risk view** — On top of those AR outputs, ClinIQ classifies **revenue risk** per invoice (high / medium / low) from overdue, short-pay, aging buckets, and stale partial pay—again with fixed rules, not opinions.
6. **Collections action queue** — Each invoice gets a **recommended action** (e.g. contact now, review short-pay, follow-up this week, monitor) and a **priority rank** for operations.
7. **Command summary** — Leadership and ops get one **snapshot**: total outstanding AR, risk-tier dollars, counts (overdue, short-paid, items requiring action now), and the **top priority invoices** from the queue.

Nothing in this chain “guesses” remittance intent or replaces bank reconciliation; it **surfaces obligation and cash truth** in a consistent shape for the team.

---

## Module 5’s role

Module 5 is the **invoice-ready output** of the claims path:

- Builds **claim items** and an **invoice package** from ledger / billable inputs.
- Preserves **line-level linkage** (e.g. claim item identity) so finance and audits can trace invoice lines back to what was executed.
- Can surface **blocking** when the package should not be treated as clean-to-invoice—so “invoice truth” is not silently wrong.

**In one sentence:** Module 5 answers *“What are we asking the sponsor to pay, and is this package defensible?”*

---

## Module 6’s role

Module 6 is the **post-invoice financial record** (v1):

- **Posts** a stable **posted invoice** (and lines) from an invoice package.
- Records **sponsor payments** and **allocations** to invoice / line obligations.
- Supports **write-offs** (v1) as balance adjustments.
- Computes **open balance**, **aging by due date**, and **derived status** (e.g. paid, partially paid, short-paid, overdue, written off)—with formulas fixed in code, not in someone’s spreadsheet.

**In one sentence:** Module 6 answers *“What did we invoice, what cash hit it, what’s still open, and how should we label it?”*

---

## AR risk layer’s role

The **risk view** does **not** change balances or status. It **reads** balance rows, aging, and (optionally) last payment timing to assign:

- A **risk level** (high / medium / low).
- **Risk reasons** (machine-readable tags such as overdue, short-paid, aging bucket, stale partial payment).

That layer is for **prioritization and reporting**, not for posting cash.

---

## Collections queue’s role

The **collections action queue** maps each risk row to:

- A **recommended action** (contact now, review short-pay, follow-up this week, monitor).
- A **priority rank** (1 = highest), sorted by risk tier, open balance, days past due, and invoice id.

This is **operational guidance**, not automated dunning or legal workflow.

---

## Command summary’s role

The **command summary** aggregates the same snapshot a leader would ask for in a stand-up:

- Total outstanding AR and dollars in each risk tier.
- How many invoices are overdue or short-paid.
- How many queue items are **not** “monitor” (i.e. need action now).
- The **top N** invoices from the queue (default five), ordered by priority.

It is a **read-only rollup** of risk rows + queue rows for a given **as-of date**.

---

## Why this is deterministic

Every step uses **explicit inputs and published rules**:

- Same invoice package, payments, allocations, adjustments, and as-of date → same posted balances, aging, statuses, risk tier, queue action, and summary totals.
- No LLM, no probabilistic matching, no hidden weighting—suitable for audit trails, regression tests, and demo repeatability.

---

## Why this matters for revenue protection

Most revenue leakage in trials is not a single catastrophic error—it is **slow drift** after startup: partial pays, silent short pays, aging that no one rolls up, and invoices that never get a clear “who owns this?” queue.

ClinIQ’s billing-to-cash stack makes that drift **visible early**:

- **Obligation truth** (what we said we earned) stays tied to **cash truth** (what applied and what’s open).
- **Risk and actions** turn open AR into **ordered work**, not a tab in a spreadsheet.
- **Summaries** let sites and sponsors align on **one picture** of exposure and priority—without changing your underlying finance systems.

That is **post-award revenue protection**: protecting the dollars you already earned on contract, not only the dollars you modeled at award.
