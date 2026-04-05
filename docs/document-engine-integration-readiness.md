# Document Engine Integration Readiness

## 1. Scope completed

The following deterministic pipeline is implemented under `lib/document-ingestion/core-bridges` (and related matching/orchestration modules), end-to-end from document-shaped inputs through a handoff payload:

- Document ingestion adapters feeding pre-rows into core bridges
- SoA, budget, and invoice core row bridges and packaged runners
- Payload builders (SoA intake, budget review, invoice review) and `runCorePayloadPackage`
- SoA structured input (`toCoreSoaStructuredInput`)
- SoA classification (`classifyCoreSoaActivities`)
- Initial expected billables (`buildInitialExpectedBillables`, also via `runSoaToExpectedBillables`)
- Revenue-protection expected rows bridge (`toRevenueProtectionExpectedRows`)
- Revenue protection review (`runRevenueProtectionReview`: match → leakage signals → review actions)
- Draft event-log rows (`toDraftEventLogRows`)
- Event-log schema candidates (`toEventLogSchemaCandidate`)
- Event-store write-input rows (`toEventStoreWriteInput`)
- Handoff payload (`toEventStoreHandoffPayload`)

A thin orchestrator (`runSoaReviewToEventStoreWriteInput`) runs the lane from classified activities + invoices through write-input. Public exports are consolidated in `core-bridges/index.ts`.

Runnable demos (local, no DB): SoA → expected billables, revenue protection, event-log candidates, event-store write-input, and handoff-equivalent chaining via scripts under `scripts/` and npm `demo:*` entries.

## 2. Stable outputs now available

| Output | Description |
|--------|-------------|
| pre-SoA rows | Normalized rows prior to SoA import bridge |
| pre-budget rows | Rows prior to budget review bridge |
| pre-invoice rows | Rows prior to invoice review bridge |
| SoA import rows | Core-ready SoA import shape from pre-SoA |
| budget review rows | Core-ready budget review rows |
| invoice review rows | Core-ready invoice review rows |
| SoA intake payload | Packaged SoA import rows with intake summary and warnings |
| budget review payload | Packaged budget review rows with summary and warnings |
| invoice review payload | Packaged invoice review rows with summary and warnings |
| classified SoA activities | Structured activities plus classification status and reasons |
| initial expected billables | Billable lines derived from classified SoA (amounts, readiness flags) |
| revenue-protection expected rows | Expected-side rows shaped for matching |
| leakage signals | Deterministic signals from match results (missing, unexpected, mismatches, etc.) |
| review actions | One action per signal, stable IDs and priorities |
| draft event-log rows | Revenue review events in draft event-log shape |
| event-log schema candidates | Candidate rows with `eventId`, `sourceRef`, `payload` |
| event-store write-input rows | Flattened fields + `clientEventId` for store-oriented ingestion |
| event-store handoff payload | `documentId`, `eventCount`, `events`, summary, warnings (no persistence) |

## 3. What is deterministic and already test-covered

- Matching and downstream steps are **deterministic** (fixed rules, no randomness).
- **No AI** and **no fuzzy matching** in this pipeline.
- **No persistence**: nothing is written to a database by these modules.
- **No Supabase** calls in this path.
- **No ledger** or **claims engine** integration in this path.

**Tests:** `lib/document-ingestion/core-bridges` has broad unit and integration-style coverage; Vitest suites for bridges, matching, and demos are intended to stay green. End-to-end demo scripts exercise SoA import → … → write-input (and handoff can be chained in code). Fixture-driven cases cover exact match (no review action), missing invoice, unexpected invoice, unit price mismatch, and mixed scenarios.

## 4. What is NOT done yet

- No database persistence for events or documents.
- No write to the production event store.
- No assignee/ownership model for events.
- No due dates or workflow state machine on these rows.
- No link from this pipeline to a live ledger or canonical event log table.
- No claims engine integration.
- No product UI wired to this pipeline.
- No notifications.
- No AI-assisted document parsing or fuzzy pairing.
- No sponsor- or study-specific billing rules beyond what adapters already encode upstream.

## 5. Recommended real integration order

1. Event-store persistence adapter
2. Event-store write path validation with a clear mock vs real store boundary
3. Link review events to the event log / action center product model
4. Connect expected billables to ledger/event layer where appropriate
5. Add selective UI surfaces on top of stable APIs
6. Only after the above, consider smarter matching or study-specific rules

## 6. Current business value already unlocked

The pipeline can already:

- Turn document-derived SoA lines into **initial expected billables** with explicit readiness flags.
- **Compare** expected rows to invoice rows on a strict match key with tolerances for numeric fields.
- **Flag** missing invoices, unexpected invoices, quantity/unit/total mismatches, and incomplete comparisons.
- Emit **review actions** suitable for an action queue.
- Produce **event-store-oriented rows** and a **handoff payload** that a persistence layer can consume without re-deriving business logic.

All of the above is reproducible in tests and local demos without touching production data.

## 7. Recommended immediate next build step

The next real engineering step should be:

**Step 48 — adapter from handoff payload into the current event-store boundary/module**

This should remain **boundary-safe**: map the handoff shape to whatever the existing event-store module expects, with explicit validation and optional feature flags. It should **not** trigger a broad refactor of core-bridges or matching logic.

---

### Optional snapshot

- **Ready now:** Deterministic bridges, matching, review actions, draft/candidate/write-input/handoff shapes, tests, local demos, stable `core-bridges` exports.
- **Not ready yet:** Persistence, real event store writes, ownership/workflow, ledger/claims/UI/notifications, AI/fuzzy rules.
- **Next build step:** Step 48 — handoff payload → event-store boundary adapter (persistence-aware at the edge only).
