# ClinIQ (Next.js)

Internal clinical operations and revenue-intelligence shell: deterministic core engines in TypeScript plus a Next.js app. Kept separate from legacy marketing or VRG site code.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (`@supabase/ssr` + `@supabase/supabase-js`). Core business logic lives under `lib/cliniq-core/` (framework-agnostic, Vitest-tested).

## Setup

```bash
cd "path/to/cliniq"
cp .env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# and SUPABASE_SERVICE_ROLE_KEY for server routes (see below).
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase (self-hosted)

ClinIQ is wired for a **self-hosted** Supabase instance (for example on your own VPS), not the hosted supabase.com project flow.

- **Environment:** copy `.env.example` → `.env.local` and fill in your instance URL and keys. Never commit `.env.local`.
- **Schema changes:** apply DDL through **your** Supabase Studio (or SQL against Postgres directly). This repo keeps SQL under `supabase/migrations/` and `supabase/schema/` as reference; there is no requirement to use `supabase link` or `supabase login` against Supabase Cloud.
- **App clients:** `supabase/server.ts` uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Route handlers that need elevated access (for example `app/api/cost-from-db`) use `SUPABASE_SERVICE_ROLE_KEY` — server-only.

Optional direct Postgres URL (psql, GUI tools) can live in `.env.local` as `DATABASE_URL`; keep it out of git.

## Core packages (`lib/cliniq-core/`)

| Area | Path | Role |
|------|------|------|
| **Module 2** | `negotiation/`, `cost-model/` | Site cost model, sponsor-offer ingest, negotiation review artifacts |
| **Module 3** | `budget-gap/` | Internal vs sponsor budget compare, gap summary, negotiation handoff |
| **Module 4** | `negotiation/` (`buildModule4Artifacts`, `module4-types`) | Orchestration: internal plan, external package, sponsor email from external package only |
| **Protocol classification** | `protocol-classification/` | SoA-shaped rows → billable / non_billable / conditional; bridge to Module 5 `ExpectedBillable`; JSON/CSV export |
| **Module 5** | `post-award-ledger/` | Expected billables (legacy + Cost Truth paths), events → billables, ledger & leakage, **traceable leakage** by billable instance, billable→ledger bridge; **execution-truth** `ExecutionBillableLine` + builder from `ClaimsLedgerRow` |
| **Claims / invoice** | `claims/` | Canonical path: execution lines → `ClaimItem` → invoice packages; legacy ledger mapping retained for compatibility |
| **Module 6 (AR)** | `ar/` | Posted invoice from `InvoicePackage`, payments, allocations, write-offs, balances, aging, AR status; risk view, collections action queue, command summary; deterministic demo harness |
| **Fee templates** | `fee-templates/` | Types and helpers aligned with the fee-template engine; **site fee pack** (`site-fee-template.json`), lookup helpers, clinical scenario payloads |
| **Cost truth** | `cost-truth/` | Procedure time × role rates, overhead, margin → `CostBreakdown` (`price_with_margin` is the loaded unit price) |
| **API helpers** | `api/` | `test-cost-client.ts`: default `CLINIQ_DEFAULT_PAYLOADS` per fee code + `POST /api/test-cost` client |
| **Revenue engine** | `analysis/`, `demo/` | Deterministic SoA ↔ budget gap, revenue projection & coverage %, negotiation actions, executive decision (`SAFE` / `MODERATE_RISK` / `HIGH_RISK`); budget vs contract alignment (terms, invoicing, red flags) with negotiation-ready copy |

**Expected billables pricing (Module 5):** `generateExpectedBillablesFromBudget` resolves unit price in order: default Cost Truth payload when `line.lineCode` matches `CLINIQ_DEFAULT_PAYLOADS` (from `lib/cliniq-core/api/test-cost-client.ts`), then optional line-level `costTruthProcedure` + params, then internal-cost multipliers, then legacy internal totals.

**Revenue pipeline (analysis):** `analyzeSoABudgetGap` → `projectRevenue` → `summarizeRevenueCoverage` → `buildNegotiationActions` → `buildRevenueDecision`. **Demos (mock data):** `npx tsx lib/cliniq-core/demo/run-revenue-analysis.ts` (full sectioned trace), `npx tsx lib/cliniq-core/demo/run-decision-demo.ts` (executive decision only).

**Canonical claims flow:** `ClaimsLedgerRow` → `ExecutionBillableLine` → `ClaimItem` → `InvoicePackage` (`buildClaimItemsCanonical`, `buildInvoicePackage` in `claims/build-claims.ts`).

**Billing-to-cash (post-award revenue protection):** `InvoicePackage` → `postInvoiceFromPackage` → `buildInvoiceBalanceView` / `buildArAgingByDueDate` → `buildInvoiceRiskView` → `buildCollectionsActionQueue` → `buildArCommandSummary`. End-to-end seeded demo: `buildArDemoScenario(asOfDate)` in `lib/cliniq-core/ar/demo-scenario.ts`.

### Product docs (billing-to-cash)

| Doc | Purpose |
|-----|---------|
| [Billing-to-cash overview](docs/cliniq-billing-to-cash-overview.md) | Plain-English flow: Module 5 vs 6, risk, queue, summary, determinism, revenue protection |
| [Demo walkthrough](docs/cliniq-demo-walkthrough.md) | Five demo invoice outcomes and what each layer shows |
| [Value narrative](docs/cliniq-value-narrative.md) | Positioning, problem, copy-ready language for demos and sponsors |

Public entry: `import { … } from "@/lib/cliniq-core/ar"` (or relative path to `lib/cliniq-core/ar/index.ts`).

## Tests

```bash
npm test              # once
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

## CLI scripts

Run with `npx tsx` from the repo root (`scripts/` and `lib/cliniq-core/demo/`):

```bash
# Revenue engine demos (lib/cliniq-core/demo/)
npx tsx lib/cliniq-core/demo/run-revenue-analysis.ts
npx tsx lib/cliniq-core/demo/run-decision-demo.ts

npx tsx scripts/run-budget-gap-analysis.ts --internal=./internal.json --sponsor=./sponsor.json [--outDir=./out]
npx tsx scripts/run-protocol-classification.ts --input=./protocol-rows.json [--outDir=./out]
npx tsx scripts/run-module2-negotiation-review.ts   # see file header for args
```

See `scripts/README.md` for conventions.

## Structure

- App routes and UI: `app/`, `components/`
- Deterministic analysis + revenue demos: `lib/cliniq-core/analysis/`, `lib/cliniq-core/demo/`
- Product notes: `docs/product-architecture.md`, `features/README.md`, `docs/cliniq-billing-to-cash-overview.md`, `docs/cliniq-demo-walkthrough.md`, `docs/cliniq-value-narrative.md`
- Database SQL and Supabase app helpers: `supabase/` (client, server, middleware, migrations, seed)

## Build

```bash
npm run build && npm start
```

Run commands from this directory so `turbopack.root` matches this app.
