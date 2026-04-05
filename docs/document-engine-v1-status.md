# Document Engine v1 — status & handoff (audit)

Last aligned with: `lib/document-ingestion/*` (parse pipeline + canonical types).

## What ingestion v1 does today

- **Classifies** inputs by file name and optional MIME type (`classify-document.ts`).
- **Orchestrates** format routing via **`parseDocument`** (`parse-document.ts`): Excel (tabular rows), PDF (plain text + optional tables), Word (plain text + optional sections).
- **Normalizes** primitive cell/string values deterministically (`normalize-records.ts`).
- **Emits a single canonical artifact**: **`ParsedDocument`** with `records: ParsedDocumentRecord[]` and `warnings: string[]` (`types.ts`).
- **Handoff view** (no engine mapping): **`toCanonicalHandoff(doc)`** — same records/warnings plus a small deterministic summary (`to-canonical-handoff.ts`).

### Canonical shape (frozen for v1 consumers)

- **`ParsedDocument`**: `schemaVersion`, `sourceType` (`excel` | `pdf` | `word` | `unknown`), optional `documentRole`, `fileName`, `mimeType`, `classificationConfidence`, `parsedAt`, `parserId`, `records`, `warnings`.
- **`ParsedDocumentRecord`**: discriminated union on **`kind`**: `soa_activity`, `budget_line`, `invoice_line`, `contract_clause`, `visit_schedule`.
- **Confidence**: numeric (and clause boolean) fields use **`ParsedField<T>`** with `ParsedFieldConfidence` = `high` | `medium` | `low` | `unverified`. Plain strings on records have no per-field confidence wrapper.
- **Traceability**: optional **`provenance`** on records (`sheetName`, `rowIndex1Based`, `columnKeys`, optional `page1Based`).
- **Warnings**: human-readable, deterministic strings; orchestrator merges classifier warnings first, then parser warnings (deduped by exact string).

## Supported path today (priority)

- **Excel-first**: pre-extracted **`rows: Record<string, unknown>[]`** → `parse-excel.ts` with header alias matching and conservative row classification (SoA vs budget-style lines).
- **PDF / Word**: **contract-only heuristic parsers** — keyword and currency heuristics on lines/paragraphs; **not** layout-faithful extraction.

## What ingestion v1 does *not* do yet

- No **connection** to the ClinIQ financial engine (SoA → billables → ledger, etc.).
- No **Supabase** or other persistence from this layer.
- No **UI** upload or rendering.
- No **OCR** or scanned-PDF recovery.
- No **AI** extraction or LLM structuring.
- No **binary** `.xlsx` / `.docx` / PDF reading inside these modules (callers supply rows or extracted text).
- No **sponsor-specific** layout packs or template learning.

## Handoff to future modules

- Downstream code should consume **`ParsedDocument`** (or **`toCanonicalHandoff`** for summaries) and map `ParsedDocumentRecord` kinds into domain models in a **separate** integration layer.
- **`classificationConfidence`** on the document reflects file-type detection only (0–1), not per-record extraction quality.
- Use **`recordHasLowConfidenceField`** / handoff **`hasLowConfidence`** to flag rows that need human review before engine ingestion.
