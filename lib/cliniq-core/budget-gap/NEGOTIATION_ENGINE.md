# Module 4 — Negotiation Engine (pre-award only)

## Architecture

This negotiation layer is **not** part of the runtime event system.

It **must not**:

- Interact with `event_log` or any live event pipeline
- Depend on Flow Agent, Finance Agent, or other operational agents
- Write to operational or financial database tables

It **is** a **pre-award** module: pure, deterministic transforms over agreed inputs.

## Inputs (in scope)

- Internal budget lines (site model)
- Sponsor budget lines
- Gap analysis from **Module 3** (`compareSponsorBudgetToInternalBudget` and derived summary / targets)

## Outputs

- Negotiation strategy buckets, pricing escalation, scenario simulations, sponsor/internal package views, and optional counteroffer text — all **in-memory** structures or client-side exports unless a future integration explicitly adds persistence (out of scope here).

## Out of scope (by design)

- **`expected_billables` generation** and any post-award billing integration: Module 4 output may **later** feed that system, but that wiring is **not** implemented in this module.

## Implementation rules

- Deterministic only (no AI, no randomness, no hidden I/O in this package)
- Keep new code in `lib/cliniq-core/budget-gap/` negotiation-related files isolated from agents, Supabase, and event engines
