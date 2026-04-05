# ClinIQ — Protocol Review (structured JSON)

## How it works

- In **Protocol Review** mode, the frontend sends `mode: "protocol"` with `/api/chat`.
- The backend **ignores** markdown-style protocol prompts for that call. It uses a fixed **JSON-only** system prompt, parses the model output, validates/normalizes it, and builds **`reply`** (markdown for the chat) from `protocol_data` server-side.
- **Source traceability:** every risk, checklist row, “this week” action, and audit red flag includes `source_reference: { section, description }` tied to the protocol. The chat markdown lists `(Source: section — description)` under each item. Missing model fields are back-filled with audit placeholders so keys are never empty after normalize.
- **Audit-defensible JSON (protocol mode):**
  - **Risks:** `title`, `audit_impact`, `likelihood` (`high` \| `medium` \| `low`), `source_reference`.
  - **Checklist (pre/during/post visit):** `item`, `verification_method`, `frequency`, `responsible_role`, `source_reference`.
  - **this_week_actions:** `action` plus the same verify/frequency/role fields and `source_reference`.
  - **audit_red_flags:** `flag`, `why_flagged`, `evidence_expected`, `source_reference`.
- If JSON is invalid, the server **retries once** with a repair prompt. If it still fails: `success: true`, `reply` = raw model text, `protocol_data: null`, `detail: "Protocol JSON parsing failed"`.
- Other modes (**contract**, **irb**, **qa**, **compare**) are unchanged: plain assistant text, no `protocol_data`.

## Run (FastAPI)

```bash
cd /path/to/project
pip install -r requirements.txt
# Copy .env.example to .env and set ANTHROPIC_API_KEY
python scripts/cliniq_backend.py
```

Open `http://127.0.0.1:8000/` — UI is served from `static/index.html`.

## Right panel

- If `protocol_data` is present: **`renderProtocolPanelFromJSON`** (overview, risks, checklist with verify/frequency/role, priorities with same meta, red flags with why/evidence).
- If `protocol_data` is null: fallback markdown parsing + notice: *Structured protocol view unavailable for this response.*

## Audit Defense Pack export

- **UI:** In **Protocol Review** mode only, the right panel shows **Audit Defense Pack** with **Generate Audit Defense Pack** (below the issue/checklist panel, above **Safety disclaimer**). The button is **disabled** until `response.protocol_data` exists; helper text explains *Run Protocol Review first…* when disabled. **Hidden** in other modes. Uses `state.protocol_data` only — no second analysis.
- **API:** `POST /api/export/audit-pack` with JSON body `{ "protocol_data": { ... }, "protocol_name"?: string, "site_name"?: string }`. Server **does not** call the model; it validates/normalizes the supplied JSON and renders Markdown. Returns `text/markdown` attachment `ClinIQ-Audit-Defense-Pack.md`. On invalid payload: `400` with detail.
- **Report:** Cover page, protocol overview, critical risk map, operational checklist (pre/during/post), this week actions, audit red flags, audit readiness statement, traceability appendix. Each risk/checklist/action/flag line includes **Source:** from `source_reference`. Professional, audit-ready wording (no AI disclaimers in the file body).
