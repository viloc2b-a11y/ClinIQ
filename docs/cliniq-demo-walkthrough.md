# ClinIQ Demo Walkthrough: Five Invoice Outcomes

This walkthrough matches the **in-memory demo scenario** in `buildArDemoScenario(asOfDate)` (e.g. `asOfDate = "2026-06-15"`). Numbers and due dates are intentional so a live demo reproduces the same classifications every time.

**Shared context**

- One study / sponsor: `ar-demo-study` / `ar-demo-sponsor`.
- Each case is a single-line invoice package, posted with its own stable invoice id.
- Payments and allocations are recorded against posted invoices; write-offs use balance adjustments.

---

## 1) Fully paid

**What happened**

- Invoice **$1,000**, due **2026-05-31**.
- Sponsor payment **$1,000** fully allocated to the invoice (payment dated before as-of).

**How the system classifies it (AR status)**

- **Open balance:** $0.
- **Paid:** yes (closed with cash; no write-offs).
- **Overdue / short-paid / partially paid:** no (nothing left open).

**What output layers show**

| Layer | What you see |
|--------|----------------|
| Balance / invoice view | Total, applied, open = 0; paid flag. |
| Aging | Invoice typically **omitted** from open-balance aging (no open AR). |
| Risk | **Low** risk tier; reasons usually empty once open is zero. |
| Collections queue | **Monitor**; low priority vs. open AR. |
| Command summary | Contributes $0 to outstanding; may still appear in queue as low-priority monitor row. |

**Action it drives**

- **Monitor** — no collections escalation; confirms clean closure.

---

## 2) Partial, current (before due)

**What happened**

- Invoice **$500**, due **2026-09-01** (after as-of **2026-06-15**).
- Payment **$200** applied → **$300** remains open, but invoice is **not yet due**.

**How the system classifies it**

- **Partially paid:** yes (cash on account, balance still open).
- **Overdue:** no (as-of is before due date).
- **Short-paid:** no (short-pay semantics require past-due or settlement-finalized conditions in v1).

**What output layers show**

| Layer | What you see |
|--------|----------------|
| Balance view | Applied $200, open $300; partial pay flags. |
| Aging | Open balance with **current** or not-yet-due aging posture (not “late” yet). |
| Risk | Typically **low** — “healthy partial” before due. |
| Collections queue | **Monitor** or light follow-up tier depending on stale-payment logic if many days since last pay; in the seeded demo, last pay is recent → **monitor**. |

**Action it drives**

- **Monitor** (demo) — watch for due date approach; ops can still outreach proactively outside the engine.

---

## 3) Overdue open (no payment)

**What happened**

- Invoice **$800**, due **2026-04-01**.
- **No** cash applied as of **2026-06-15** → full balance still open, past due.

**How the system classifies it**

- **Overdue:** yes.
- **Short-paid:** no (no payment activity on this invoice).
- **Partially paid:** no.

**What output layers show**

| Layer | What you see |
|--------|----------------|
| Balance view | Full open balance; overdue status. |
| Aging | Past-due bucket (e.g. 31–60+ days depending on as-of vs. due). |
| Risk | **High** when overdue combines with deeper aging buckets; otherwise **medium** in earlier past-due bands—demo as-of usually pushes this toward **high** exposure. |
| Collections queue | **Contact now** (high + overdue path) or strong follow-up. |
| Command summary | Counts toward **overdue** invoices and **action-now** queue rows; lifts **high-risk AR** dollars. |

**Action it drives**

- **Contact now** — sponsor outreach and internal ownership assignment.

---

## 4) Short-paid (underpaid after due date)

**What happened**

- Invoice **$600**, due **2026-05-01**.
- Payment **$200** applied → **$400** open, **past due**, **no write-off**.

**How the system classifies it**

- **Short-paid:** yes (payment exists, balance open, past due, no write-off in v1 rules).
- **Partially paid:** no (mutually exclusive with short-paid in hardened semantics).
- **Overdue:** yes.

**What output layers show**

| Layer | What you see |
|--------|----------------|
| Balance view | Applied vs. open; overdue + short-pay signals. |
| Aging | Past-due with material open balance. |
| Risk | **High** (short-paid + overdue is a defined high path). |
| Collections queue | **Review short-pay** when high tier includes `short_paid` in reasons (per queue rules). |
| Command summary | Increments **short-paid** count; high-tier dollars; top priority candidate. |

**Action it drives**

- **Review short-pay** — remittance vs. contract, dispute vs. error, and whether to formalize settlement or additional billing.

---

## 5) Write-off close

**What happened**

- Invoice **$400**, due **2026-05-15**.
- Cash **$100** + **write-off $300** → **$0** open.

**How the system classifies it**

- **Written off:** yes (closure included write-off; not “paid” in the pure-cash sense).
- **Paid (cash-only flag):** no (write-offs present).
- **Overdue / short-paid:** no once balance is zero.

**What output layers show**

| Layer | What you see |
|--------|----------------|
| Balance view | Open = 0; write-off total visible; written-off status. |
| Aging | Typically **no** open AR row (aging is open-balance driven). |
| Risk | **Low** with cleared reasons when open is zero. |
| Collections queue | **Monitor** — no balance to collect; audit trail remains. |
| Command summary | $0 outstanding from this invoice; counts reflect closure. |

**Action it drives**

- **Monitor** — document closure; finance review of write-off reason; no active collection.

---

## How to run the demo (engineering)

Call `buildArDemoScenario("2026-06-15")` and walk the returned object in order:

`invoices` → `balanceRows` → `agingRows` → `riskRows` → `queueRows` → `commandSummary`.

That is the full **execution → invoice → AR → risk → collections → summary** story in one deterministic pass.
