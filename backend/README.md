# ClinIQ — Python API (`backend/`)

This directory is the **FastAPI** service (protocol review, contracts, static UI) inside the **ClinIQ monorepo**. The **Next.js** app and TypeScript engines live at the **repository root**; see the root [`README.md`](../README.md) for `npm run dev`, Supabase, and document-ingestion flows.

---

# ClinIQ

AI assistant for **independent clinical research sites**: contract review, IRB-oriented drafts, regulatory Q&A, contract comparison, and **protocol review** with structured, audit-oriented output.

> **Disclaimer:** Outputs are for operational support only. They do not replace legal counsel, IRB approval, PI oversight, or regulatory advice.

---

## README — ClinIQ

### What ClinIQ Is

ClinIQ is an **execution-first clinical site operating system** designed to:

* reduce protocol deviations
* standardize site operations
* generate audit-ready documentation
* provide real-time operational visibility

It combines **protocol intelligence + operational playbooks + execution tracking + audit defense**.

---

## Core Capabilities

### 1. Protocol Intelligence Engine

Upload a protocol and automatically generate:

* Risk classification (Critical / Medium / Low)
* Daily operational checklist (pre / during / post visit)
* Weekly priorities
* CRA / audit red flags

**Value**

* Sites: understand execution risk instantly
* CROs: faster feasibility + lower onboarding friction

---

### 2. Audit Defense Pack

Generates a structured, audit-ready package:

* Site actions (this week)
* Compliance checklist
* Audit red flags
* Execution guidance

**Value**

* Sites: ready for monitoring visits
* CROs: reduced audit findings
* Sponsors: higher data reliability

---

### 3. Site Playbooks (Operational Layer)

Static, standardized documents:

* SOP — Protocol Deviation Prevention
* Training Module
* Daily Checklist (printable)
* Weekly Control Sheet

All documents are:

* printable
* signature-ready
* designed for real site workflows

**Value**

* Sites: immediate operational standardization
* CROs: consistent execution across sites

---

### 4. Paper + Digital Hybrid System

#### Paper Layer

* real execution happens here
* printed checklists
* signed documentation

#### Digital Shadow (Visit Log)

* minimal input after visit:

  * completed ✔
  * verified ✔
  * date
  * CRC

**Value**

* Sites: no workflow disruption
* CROs: traceability without burden

---

### 5. Visit Log (Execution Tracking)

Captures minimal operational evidence:

* visit type
* completion status
* verification status
* responsible staff

**Value**

* Sites: proof of execution
* CROs: visibility into site behavior

---

### 6. Operations Dashboard (VPI-style)

Real-time operational view:

#### Risk Overview

* protocol risk levels
* critical issues

#### Visit Execution

* completion rate
* verification rate

#### Compliance Alerts

* missing logs
* unverified visits
* missing audit packs

#### Audit Readiness

* SOP / training / checklist presence
* audit pack status

---

### 7. Traffic-Light Scoring (Red / Yellow / Green)

Each section is scored:

* 🔴 At Risk
* 🟡 Needs Attention
* 🟢 On Track

**Value**

* instant understanding
* no complex analytics required

---

## How to Use ClinIQ (Workflow)

### Step 1 — Upload Protocol

* generate risks, checklist, priorities

---

### Step 2 — Review Protocol Output

* identify execution risks
* review audit red flags

---

### Step 3 — Generate Audit Defense Pack

* prepare site for execution
* align team

---

### Step 4 — Use Site Playbooks

* train staff
* print checklists
* standardize workflow

---

### Step 5 — Execute Visits

* use printed checklist
* sign documentation

---

### Step 6 — Log Visit (Digital Shadow)

* mark:

  * completed
  * verified

---

### Step 7 — Monitor Dashboard

* identify risks
* track execution
* detect gaps early

---

## Why This Matters

### For Sites

* fewer protocol deviations
* faster onboarding
* better audit readiness
* higher credibility with sponsors

👉 translates to:

* more studies
* better performance
* higher revenue

---

### For CROs

* standardized site execution
* lower monitoring burden
* early risk detection
* better data quality

👉 translates to:

* faster trials
* fewer issues
* scalable site networks

---

### For Sponsors

* improved protocol adherence
* reduced variability
* higher confidence in sites

---

## What ClinIQ Is NOT

* not a document management system
* not an EDC
* not a CTMS

👉 it is the **execution layer between protocol and reality**

---

## Key Design Principles

* execution-first (not documentation-first)
* simple over complex
* paper-compatible
* audit-oriented
* zero friction for sites

---

## MVP Scope (Current)

* protocol analysis
* audit defense pack
* site playbooks
* printable documents
* visit log (in-memory)
* operations dashboard
* traffic-light scoring

---

## Roadmap (Next Phases)

* digital checklist tracking
* persistent storage
* multi-site dashboard
* certification system
* CRO-facing portal

---

## Positioning

ClinIQ is:

👉 **“The operating system for clinical trial execution at the site level.”**

---

## Quick Start

1. Start backend:

```bash
fastapi dev scripts/cliniq_backend.py
```

2. Open:

```
http://127.0.0.1:8000
```

3. Upload protocol
4. Generate outputs
5. Print checklist
6. Log visits
7. Monitor dashboard

---

## Bottom Line

ClinIQ does one thing:

👉 **turn protocols into consistent, auditable execution**

That’s where the real value is.

---

## Application modes & technical reference

### Features

| Mode | Purpose |
|------|---------|
| **Contract** | Analyze CTAs for site risk (indemnification, IP, payments, termination, etc.) |
| **IRB** | Draft-style documents (e.g., informed consent) with Common Rule–oriented structure |
| **Regulatory Q&A** | FDA / ICH–style answers with citations |
| **Compare** | Side-by-side review of two contract versions |
| **Protocol Review** | JSON-first analysis: risks, visit checklists, weekly actions, audit red flags — each tied to `source_reference` (protocol section) |

Protocol mode returns **`protocol_data`** (parsed JSON) plus a server-built **`reply`** (markdown). See [PROTOCOL_REVIEW.md](PROTOCOL_REVIEW.md) for behavior, schema shape, and UI notes.

---

### What the site can accomplish (tasks)

ClinIQ supports concrete workflows for **site leadership, contracts, regulatory, and clinical operations**:

| Area | Tasks you can run |
|------|-------------------|
| **Contracts** | First-pass review of a CTA; extract high-risk clauses (indemnification, injury, IP/data, publication, payment, termination, insurance, governing law); obtain **negotiation-oriented** summaries and suggested language to discuss with counsel. |
| **Version control** | Compare **two** contract versions to see material vs editorial changes and whether the new text is better or worse for the site. |
| **IRB / consent** | Generate **draft** participant-facing documents (e.g., ICF-style sections) aligned with Common Rule–style expectations; collect notes for IRB submission and local customization. |
| **Regulatory** | Ask operational questions (GCP, 21 CFR, ICH) and get answers framed for **small sites**, with citations — still verified by qualified staff. |
| **Protocol / operations** | Turn a protocol into an **execution and audit-readiness** view: prioritized risks, visit checklists (with who does what and how a monitor would verify it), near-term actions, and audit red flags **mapped to protocol sections** (`source_reference`). |

All tasks assume you **upload or paste** the relevant document or question; outputs are **starting points** for human review.

---

### Expected outcomes (deliverables)

Depending on the mode, you should expect:

- **Structured narrative** in the chat (headings, bullets, severity labels where applicable).
- **Actionable lists**: issues to fix, clauses to negotiate, or steps to take — not generic advice only.
- **Protocol Review:** additionally, **machine-readable `protocol_data`** for the UI panel (overview, risks, checklist phases, weekly actions, red flags) plus markdown **`reply`** generated from that data.
- **Traceability in protocol mode:** each item includes a **source reference** (section + short description) so staff can cross-check against the approved protocol.
- **Explicit limits:** reminders that AI output is **not** legal, IRB, or medical approval — your site remains accountable for final decisions.

---

### Advantages for the research site

| Benefit | Why it matters |
|---------|----------------|
| **Faster prep** | Reduces unstructured reading time before sponsor/CRO calls, legal review, or feasibility meetings. |
| **Fewer blind spots** | Prompts are tuned for **independent sites** (not sponsor-default framing), so common site-level risks surface earlier. |
| **Better handoffs** | Contract and protocol outputs are organized so **PI, CRC, and leadership** can assign follow-ups clearly. |
| **Audit-oriented protocol view** | Checklists emphasize **verifiability** (how a CRA/auditor would check), **roles**, and **evidence** — supporting “we identified risks and controls” narratives when paired with your real SOPs and source documents. |
| **Scalable consistency** | Small teams get a repeatable **first pass**; quality still depends on your policies, training, and professional review. |
| **Cost awareness** | Uses your own API key and local or controlled hosting; no substitute for counsel, but can lower **rounds** of unstructured back-and-forth. |

---

### Requirements

- Python 3.10+ (recommended)
- [Anthropic API](https://www.anthropic.com/) key

### Setup

```bash
cd /path/to/ClinIQ
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required. Your API key. |
| `ANTHROPIC_MODEL` | Optional. Default: `claude-3-5-sonnet-20241022` |
| `MAX_DOC_CHARS` | Optional. Max characters extracted from uploads (default `15000`) |
| `CORS_ORIGINS` | Optional. Comma-separated origins, or `*` (default) |

### Run

```bash
python scripts/cliniq_backend.py
```

Or, with the FastAPI CLI (as in Quick Start above):

```bash
fastapi dev scripts/cliniq_backend.py
```

Open **http://127.0.0.1:8000/** in your browser (include **`:8000`** — `http://127.0.0.1/` alone will not reach this app).

- **Health check:** `GET /health`
- **Upload:** `POST /api/upload` (PDF, DOCX, TXT)
- **Chat:** `POST /api/chat` (JSON body) or `POST /api/chat/form` (multipart)
- **Protocol export:** `POST /api/export/audit-pack` — body `{ "protocol_data": {...}, "protocol_name"?: "", "site_name"?: "" }` → downloadable Markdown **Audit Defense Pack** (see [PROTOCOL_REVIEW.md](PROTOCOL_REVIEW.md))
- **Dashboard:** `GET /api/dashboard/summary` — operations metrics and traffic-light status (in-memory for the running server)

Static UI is served from `static/` (a `build/` copy may be kept in sync for deployment workflows).

### Project layout

```
scripts/cliniq_backend.py   # FastAPI app, prompts, protocol JSON pipeline
static/                     # Web UI
build/                      # Mirror of static (optional)
uploads/                    # Created at runtime for uploads (gitignored)
```

### Contributing / GitHub

Clone from the repository you use (for example):

`https://github.com/viloc2b-a11y/ClinIQ`

Pull requests and issues welcome; keep contract and protocol prompts aligned between `static/index.html` and `PROMPTS` / `PROTOCOL_JSON_SYSTEM` in `cliniq_backend.py` when changing behavior.

### Troubleshooting

| Symptom | What to do |
|---------|------------|
| **ERR_EMPTY_RESPONSE** or connection errors | The app is not running or crashed on startup. In the project folder run `pip install -r requirements.txt`, then `python scripts/cliniq_backend.py`. If you use a venv, activate it **before** `pip install` and **before** starting the server. |
| Wrong page / nothing loads | Use **http://127.0.0.1:8000/** (not port 80). |
| Chat/API errors | Ensure `.env` has a valid `ANTHROPIC_API_KEY`. |
