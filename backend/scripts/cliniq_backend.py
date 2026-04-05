import io
import json
import logging
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))
try:
    import operational_pdf
except ImportError:
    operational_pdf = None  # type: ignore[misc, assignment]
try:
    import inspection_engine
except ImportError:
    inspection_engine = None  # type: ignore[misc, assignment]

import anthropic
import fitz  # PyMuPDF
from docx import Document
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

load_dotenv()
API_KEY = os.getenv("ANTHROPIC_API_KEY")
# Model id configurable; "claude-sonnet-4-6" is not a valid API id — override via .env if needed.
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
MAX_DOC_CHARS = int(os.getenv("MAX_DOC_CHARS", "15000"))

app = FastAPI(title="ClinIQ - AI Contract & IRB Assistant")

_cors = os.getenv("CORS_ORIGINS", "*").strip()
_allow_origins = ["*"] if _cors == "*" else [o.strip() for o in _cors.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=(_cors != "*"),
    allow_methods=["*"],
    allow_headers=["*"],
)

static_path = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(static_path, exist_ok=True)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

# Keep in sync with static/index.html PROMPTS when changing behavior.
PROMPTS: dict[str, str] = {
    "contract": """You are a senior attorney specializing in clinical trial agreements (CTAs) with over 15 years of experience exclusively representing independent research sites, physician practices, and small site networks in the United States.

You have deep expertise in:
- 21 CFR Parts 11, 50, 54, 56, 312
- ICH E6(R3) Good Clinical Practice
- Standard negotiation practices between sites and large sponsors/CROs
- Financial and operational risks that most affect small independent sites

Task:
Analyze the full clinical trial contract provided.

First, think step-by-step internally:
1. Identify the most critical clauses for an independent research site (indemnification, subject injury, intellectual property/data ownership, publication rights, payment terms and timelines, termination, insurance, governing law).
2. Assess the risk level for the site (High / Medium / Low).
3. Compare against site-friendly industry standards.

Then, respond EXACTLY in this format:

### Executive Summary
[3-5 clear sentences giving an overall assessment of the contract from the site's perspective. State whether it is favorable, risky, or neutral.]

### Issues Detected (ordered by severity)
**[CRITICAL]** Brief issue name
→ Clear description of the problem and why it is risky for the site
→ Potential impact
→ Suggested negotiation language: "Exact recommended text"

**[MODERATE]** ...
**[MINOR]** ...

### Contract Strengths
[List any clauses that are well-written or favorable to the site]

### Recommended Next Steps
- Numbered list of concrete, prioritized actions (negotiation points, legal review, etc.)

Always end with:
⚠️ This analysis is for support purposes only. All outputs must be reviewed and validated by your specialized clinical research legal counsel before signing or negotiating. It does not replace personalized legal advice.""",
    "irb": """You are a senior IRB submission specialist with extensive experience preparing documents for both local and central IRBs (WCG, Advarra, Copernicus, etc.) in the United States.

Your task is to generate high-quality drafts based on the protocol or study description provided.

Rules:
- Use clear, simple language at an 8th-grade reading level for participants.
- Be accurate, neutral, and ethical.
- Include all required elements according to 21 CFR 50.25 and 45 CFR 46 (Common Rule).

For Informed Consent Forms (ICF), always include these sections:
- Purpose of the study
- Procedures (what will happen and duration)
- Possible risks and discomforts
- Possible benefits (be realistic)
- Alternative procedures or treatments
- Confidentiality and data protection
- Compensation and medical treatment for injury
- Contacts for questions and rights
- Voluntary participation and right to withdraw

Respond exactly in this format:

### Document Type
[Example: Draft Informed Consent Form]

### Full Draft
[Complete, well-formatted text ready for review]

### Notes for IRB / Site
- Points that need customization or special attention
- Potential questions the IRB might raise

Always end with:
**This is an AI-generated draft for review only. It must not be used without final approval from the appropriate IRB and legal review.**""",
    "qa": """You are a senior regulatory expert in clinical research with deep knowledge of U.S. FDA regulations and ICH guidelines.

Key knowledge base:
- 21 CFR Parts 11, 50, 54, 56, 312, 314, 600
- ICH E6(R3), E8(R1), E9, E10
- Common Rule (45 CFR 46)
- Current FDA guidance documents (2024-2026)

Response Rules:
1. Give a direct, clear answer first.
2. Cite the exact regulation or guidance (e.g., "According to 21 CFR 312.60...").
3. Provide practical context for small independent research sites.
4. If there is regulatory ambiguity or gray area, clearly state it.
5. Offer practical recommendations when appropriate.

If you are not 100% certain: "I recommend consulting with a regulatory expert or directly with the FDA/IRB." """,
    "compare": """You are an expert in comparative analysis of clinical trial contracts.

Task:
Compare Version 1 and Version 2 of the contract provided.

Respond exactly in this format:

### Material / Critical Changes
- List each significant change (indemnification, IP, publication rights, payments, termination, etc.)
- Indicate whether the change is favorable, unfavorable, or neutral for the research site
- Provide suggested negotiation language if unfavorable

### Minor or Editorial Changes
[List them]

### Overall Assessment
- Is the new version better or worse for the site overall?
- Key points that must be negotiated
- Final recommendation: Sign as is, Negotiate, or Reject

Be objective and always prioritize the interests and protection of the independent research site.""",
    # Protocol mode uses PROTOCOL_JSON_SYSTEM + JSON flow in /api/chat (this string is unused for LLM).
    "protocol": "[Protocol Review uses server-side JSON; see PROTOCOL_JSON_SYSTEM in cliniq_backend.py]",
}

PROTOCOL_JSON_SCHEMA_DOC = r"""{
  "overview": {
    "phase": "string",
    "indication": "string",
    "complexity": "low | medium | high",
    "site_burden": "low | medium | high",
    "summary": "string"
  },
  "critical_risks": [
    {
      "title": "string",
      "audit_impact": "what happens if this fails during audit",
      "likelihood": "high | medium | low",
      "source_reference": { "section": "string", "description": "string" }
    }
  ],
  "medium_risks": [
    {
      "title": "string",
      "audit_impact": "string",
      "likelihood": "high | medium | low",
      "source_reference": { "section": "string", "description": "string" }
    }
  ],
  "low_risks": [
    {
      "title": "string",
      "audit_impact": "string",
      "likelihood": "high | medium | low",
      "source_reference": { "section": "string", "description": "string" }
    }
  ],
  "checklist": {
    "pre_visit": [
      {
        "item": "string",
        "verification_method": "how a CRA/auditor would verify this was done",
        "frequency": "per visit | daily | weekly",
        "responsible_role": "CRC | PI | Sub-I | Coordinator",
        "source_reference": { "section": "string", "description": "string" }
      }
    ],
    "during_visit": [
      {
        "item": "string",
        "verification_method": "string",
        "frequency": "per visit | daily | weekly",
        "responsible_role": "CRC | PI | Sub-I | Coordinator",
        "source_reference": { "section": "string", "description": "string" }
      }
    ],
    "post_visit": [
      {
        "item": "string",
        "verification_method": "string",
        "frequency": "per visit | daily | weekly",
        "responsible_role": "CRC | PI | Sub-I | Coordinator",
        "source_reference": { "section": "string", "description": "string" }
      }
    ]
  },
  "this_week_actions": [
    {
      "action": "string",
      "verification_method": "string",
      "frequency": "string",
      "responsible_role": "string",
      "source_reference": { "section": "string", "description": "string" }
    }
  ],
  "audit_red_flags": [
    {
      "flag": "string",
      "why_flagged": "why a CRA/auditor would detect this",
      "evidence_expected": "what documentation they will request",
      "source_reference": { "section": "string", "description": "string" }
    }
  ]
}"""

PROTOCOL_JSON_SYSTEM = """You are a senior Clinical Research Coordinator (CRC) and Audit Readiness Specialist with 12+ years of experience supporting FDA-inspected clinical research sites.

Your role is not only to identify risks, but to ensure the site can DEFEND its operations during audits and monitoring visits.

You must convert the protocol into an AUDIT-DEFENSIBLE SYSTEM.

Focus on:
- Prevention of protocol deviations
- Documentation practices
- Verifiable execution
- Evidence generation

CRITICAL REQUIREMENT:

Every checklist item and action must be:
- Actionable
- Verifiable
- Auditable

This means:
- It must be possible to confirm it was done
- It must leave evidence
- It must be tied to a protocol section (source_reference.section and source_reference.description)

Risks must include audit_impact (what happens if this fails during audit) and likelihood (high | medium | low).

Checklist items MUST include verification_method, frequency, and responsible_role.

audit_red_flags MUST include why_flagged and evidence_expected.

---

OUTPUT RULES

Return VALID JSON ONLY matching the schema.
Do NOT use markdown.
Do NOT include explanations outside JSON.
Do NOT wrap in code blocks.

Ground every item in the protocol text supplied. Do NOT invent protocol requirements."""

PROTOCOL_JSON_REPAIR_SYSTEM = """You fix invalid JSON. Output VALID JSON ONLY matching the schema the user provides. No markdown, no code fences, no explanation."""


def _str(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, str):
        return v
    if isinstance(v, (int, float, bool)):
        return str(v)
    return ""


def _str_list(v: Any) -> list[str]:
    if not isinstance(v, list):
        return []
    return [_str(x) for x in v]


def _normalize_source_reference(obj: Any) -> dict[str, str]:
    """Ensure non-empty section + description for audit traceability."""
    sec, desc = "", ""
    if isinstance(obj, dict):
        sec = _str(obj.get("section")).strip()
        desc = _str(obj.get("description")).strip()
    if not sec:
        sec = "(inferred — verify in protocol)"
    if not desc:
        desc = "Cross-check this finding against the cited section in the approved protocol."
    return {"section": sec, "description": desc}


def _normalize_likelihood(v: Any) -> str:
    s = _str(v).strip().lower()
    if s in ("high", "medium", "low"):
        return s
    return "medium"


def _normalize_risk_items(items: Any) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    out: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        audit_impact = _str(item.get("audit_impact")).strip()
        if not audit_impact:
            parts: list[str] = []
            wr = _str(item.get("why_high_risk")).strip()
            if wr:
                parts.append(wr)
            cd = _str_list(item.get("common_deviations"))
            if cd:
                parts.append("Common deviations: " + "; ".join(cd))
            pr = _str_list(item.get("prevention"))
            if pr:
                parts.append("Controls / prevention: " + "; ".join(pr))
            audit_impact = " ".join(parts).strip()
        if not audit_impact:
            audit_impact = "Define regulatory/monitoring impact and required corrective controls."
        out.append(
            {
                "title": _str(item.get("title")),
                "audit_impact": audit_impact,
                "likelihood": _normalize_likelihood(item.get("likelihood")),
                "source_reference": _normalize_source_reference(item.get("source_reference")),
            }
        )
    return out


def _normalize_checklist_row(x: Any) -> dict[str, Any]:
    if isinstance(x, str):
        return {
            "item": _str(x),
            "verification_method": "CRA/auditor reviews source documents, dated signatures, and contemporaneous logs.",
            "frequency": "per visit",
            "responsible_role": "CRC",
            "source_reference": _normalize_source_reference({}),
        }
    if isinstance(x, dict):
        vm = _str(x.get("verification_method")).strip()
        if not vm:
            vm = "Verify via source documentation review and date-stamped records."
        freq = _str(x.get("frequency")).strip()
        if not freq:
            freq = "per visit"
        role = _str(x.get("responsible_role")).strip()
        if not role:
            role = "CRC"
        return {
            "item": _str(x.get("item")),
            "verification_method": vm,
            "frequency": freq,
            "responsible_role": role,
            "source_reference": _normalize_source_reference(x.get("source_reference")),
        }
    return {
        "item": "",
        "verification_method": "Verify via source documentation review.",
        "frequency": "per visit",
        "responsible_role": "CRC",
        "source_reference": _normalize_source_reference({}),
    }


def _normalize_checklist_phase(items: Any) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    return [_normalize_checklist_row(x) for x in items]


def _normalize_this_week_actions(items: Any) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    out: list[dict[str, Any]] = []
    for x in items:
        if isinstance(x, str):
            out.append(
                {
                    "action": _str(x),
                    "verification_method": "Document completion in study file, CTMS, or training log.",
                    "frequency": "this week",
                    "responsible_role": "CRC",
                    "source_reference": _normalize_source_reference({}),
                }
            )
        elif isinstance(x, dict):
            vm = _str(x.get("verification_method")).strip()
            if not vm:
                vm = "Document completion in study file, CTMS, or training log."
            freq = _str(x.get("frequency")).strip()
            if not freq:
                freq = "this week"
            role = _str(x.get("responsible_role")).strip()
            if not role:
                role = "CRC"
            out.append(
                {
                    "action": _str(x.get("action")),
                    "verification_method": vm,
                    "frequency": freq,
                    "responsible_role": role,
                    "source_reference": _normalize_source_reference(x.get("source_reference")),
                }
            )
    return out


def _normalize_audit_red_flags(items: Any) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    out: list[dict[str, Any]] = []
    for x in items:
        if isinstance(x, str):
            out.append(
                {
                    "flag": _str(x),
                    "why_flagged": "CRA/auditor may identify deviation from protocol or ICH GCP documentation expectations.",
                    "evidence_expected": "Source documents, monitoring correspondence, and regulatory binders.",
                    "source_reference": _normalize_source_reference({}),
                }
            )
        elif isinstance(x, dict):
            wf = _str(x.get("why_flagged")).strip()
            if not wf:
                wf = "Monitor/auditor may identify inconsistency with protocol or GCP expectations."
            ev = _str(x.get("evidence_expected")).strip()
            if not ev:
                ev = "Relevant source documents, logs, and correspondence per monitoring plan."
            out.append(
                {
                    "flag": _str(x.get("flag")),
                    "why_flagged": wf,
                    "evidence_expected": ev,
                    "source_reference": _normalize_source_reference(x.get("source_reference")),
                }
            )
    return out


def validate_and_normalize_protocol_data(raw: dict[str, Any]) -> dict[str, Any] | None:
    """Lightweight validation: required top-level keys and types after normalization."""
    if not isinstance(raw, dict):
        return None
    ov_in = raw.get("overview")
    if not isinstance(ov_in, dict):
        ov_in = {}
    overview = {
        "phase": _str(ov_in.get("phase")),
        "indication": _str(ov_in.get("indication")),
        "complexity": _str(ov_in.get("complexity")),
        "site_burden": _str(ov_in.get("site_burden")),
        "summary": _str(ov_in.get("summary")),
    }
    ch_in = raw.get("checklist")
    if not isinstance(ch_in, dict):
        ch_in = {}
    checklist = {
        "pre_visit": _normalize_checklist_phase(ch_in.get("pre_visit")),
        "during_visit": _normalize_checklist_phase(ch_in.get("during_visit")),
        "post_visit": _normalize_checklist_phase(ch_in.get("post_visit")),
    }
    data = {
        "overview": overview,
        "critical_risks": _normalize_risk_items(raw.get("critical_risks")),
        "medium_risks": _normalize_risk_items(raw.get("medium_risks")),
        "low_risks": _normalize_risk_items(raw.get("low_risks")),
        "checklist": checklist,
        "this_week_actions": _normalize_this_week_actions(raw.get("this_week_actions")),
        "audit_red_flags": _normalize_audit_red_flags(raw.get("audit_red_flags")),
    }
    required_roots = (
        "overview",
        "critical_risks",
        "medium_risks",
        "low_risks",
        "checklist",
        "this_week_actions",
        "audit_red_flags",
    )
    for k in required_roots:
        if k not in data:
            return None
    if not isinstance(data["overview"], dict) or not isinstance(data["checklist"], dict):
        return None
    return data


def _extract_json_object(text: str) -> str | None:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```\s*$", "", t)
    start = t.find("{")
    end = t.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    return t[start : end + 1]


def _try_parse_protocol_json(raw_text: str) -> dict[str, Any] | None:
    blob = _extract_json_object(raw_text)
    if not blob:
        return None
    try:
        parsed = json.loads(blob)
    except json.JSONDecodeError:
        return None
    if not isinstance(parsed, dict):
        return None
    return validate_and_normalize_protocol_data(parsed)


def _md_source_line(sr: Any) -> str:
    if not isinstance(sr, dict):
        sr = {}
    s = _str(sr.get("section"))
    d = _str(sr.get("description"))
    return f"(Source: {s} — {d})"


def protocol_data_to_markdown(data: dict[str, Any]) -> str:
    ov = data["overview"]
    parts: list[str] = [
        "### Protocol Overview",
        f"- Phase: {ov.get('phase', '')}",
        f"- Indication: {ov.get('indication', '')}",
        f"- Complexity: {ov.get('complexity', '')}",
        f"- Site burden: {ov.get('site_burden', '')}",
        f"- Summary: {ov.get('summary', '')}",
        "",
        "### Critical Risks",
    ]
    for r in data.get("critical_risks", []):
        parts.append(f"**[CRITICAL RISK]** {r.get('title', '')}")
        parts.append(f"- Audit impact: {r.get('audit_impact', '')}")
        parts.append(f"- Likelihood: {r.get('likelihood', '')}")
        parts.append(f"- {_md_source_line(r.get('source_reference'))}")
        parts.append("")
    parts.append("### Medium Risks")
    for r in data.get("medium_risks", []):
        parts.append(f"**[MEDIUM RISK]** {r.get('title', '')}")
        parts.append(f"- Audit impact: {r.get('audit_impact', '')}")
        parts.append(f"- Likelihood: {r.get('likelihood', '')}")
        parts.append(f"- {_md_source_line(r.get('source_reference'))}")
        parts.append("")
    parts.append("### Low Risks")
    for r in data.get("low_risks", []):
        parts.append(f"**[LOW RISK]** {r.get('title', '')}")
        parts.append(f"- Audit impact: {r.get('audit_impact', '')}")
        parts.append(f"- Likelihood: {r.get('likelihood', '')}")
        parts.append(f"- {_md_source_line(r.get('source_reference'))}")
        parts.append("")
    ch = data.get("checklist") or {}
    parts.append("### Daily Compliance Checklist (ACTIONABLE)")
    parts.append("**Pre-visit**")
    for row in ch.get("pre_visit") or []:
        r = _normalize_checklist_row(row)
        parts.append(f"- ✔ {r['item']}")
        parts.append(
            f"  - Verify: {r['verification_method']} | Frequency: {r['frequency']} | Role: {r['responsible_role']}"
        )
        parts.append(f"  {_md_source_line(r.get('source_reference'))}")
    parts.append("")
    parts.append("**During visit**")
    for row in ch.get("during_visit") or []:
        r = _normalize_checklist_row(row)
        parts.append(f"- ✔ {r['item']}")
        parts.append(
            f"  - Verify: {r['verification_method']} | Frequency: {r['frequency']} | Role: {r['responsible_role']}"
        )
        parts.append(f"  {_md_source_line(r.get('source_reference'))}")
    parts.append("")
    parts.append("**Post-visit**")
    for row in ch.get("post_visit") or []:
        r = _normalize_checklist_row(row)
        parts.append(f"- ✔ {r['item']}")
        parts.append(
            f"  - Verify: {r['verification_method']} | Frequency: {r['frequency']} | Role: {r['responsible_role']}"
        )
        parts.append(f"  {_md_source_line(r.get('source_reference'))}")
    parts.append("")
    parts.append("### Immediate Site Actions (TOP PRIORITIES)")
    for row in data.get("this_week_actions") or []:
        parts.append(f"- {row.get('action', '')}")
        parts.append(
            f"  - Verify: {row.get('verification_method', '')} | "
            f"Frequency: {row.get('frequency', '')} | Role: {row.get('responsible_role', '')}"
        )
        parts.append(f"  {_md_source_line(row.get('source_reference'))}")
    parts.append("")
    parts.append("### Red Flags for Monitors / Audits")
    for row in data.get("audit_red_flags") or []:
        parts.append(f"- {row.get('flag', '')}")
        parts.append(f"  - Why flagged: {row.get('why_flagged', '')}")
        parts.append(f"  - Evidence expected: {row.get('evidence_expected', '')}")
        parts.append(f"  {_md_source_line(row.get('source_reference'))}")
    parts.append("")
    parts.append(
        "⚠️ This is an AI-generated compliance support tool. It does not replace team training, "
        "sponsor guidance, monitoring, or official protocol interpretation."
    )
    return "\n".join(parts).strip()


def _audit_pack_source_bullet(sr: Any) -> str:
    """Single indented markdown bullet: Source: section — description (from protocol_data only)."""
    if not isinstance(sr, dict):
        sr = {}
    sec = _str(sr.get("section")).strip()
    desc = _str(sr.get("description")).strip()
    if not sec:
        sec = "—"
    if not desc:
        desc = "—"
    return f"  - **Source:** {sec} — {desc}"


def _audit_pack_flatten_text(s: str) -> str:
    t = _str(s).strip()
    if not t:
        return "—"
    return " ".join(t.splitlines())


def _collect_traceability_index(data: dict[str, Any]) -> list[tuple[str, str]]:
    seen: set[tuple[str, str]] = set()
    rows: list[tuple[str, str]] = []

    def add(sr: Any) -> None:
        if not isinstance(sr, dict):
            return
        sec = _str(sr.get("section")).strip()
        desc = _str(sr.get("description")).strip()
        key = (sec, desc)
        if key in seen or (not sec and not desc):
            return
        seen.add(key)
        rows.append(key)

    for r in data.get("critical_risks", []) or []:
        add(r.get("source_reference"))
    for r in data.get("medium_risks", []) or []:
        add(r.get("source_reference"))
    for r in data.get("low_risks", []) or []:
        add(r.get("source_reference"))
    ch = data.get("checklist") or {}
    for phase in ("pre_visit", "during_visit", "post_visit"):
        for row in ch.get(phase) or []:
            add(row.get("source_reference") if isinstance(row, dict) else None)
    for row in data.get("this_week_actions", []) or []:
        add(row.get("source_reference") if isinstance(row, dict) else None)
    for row in data.get("audit_red_flags", []) or []:
        add(row.get("source_reference") if isinstance(row, dict) else None)
    rows.sort(key=lambda x: (x[0].lower(), x[1].lower()))
    return rows


def build_audit_pack_markdown(
    data: dict[str, Any],
    protocol_name: str = "",
    site_name: str = "",
) -> str:
    """Formal audit-ready markdown report from normalized protocol_data."""
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    pn = _str(protocol_name).strip() or "Not specified"
    sn = _str(site_name).strip() or "Not specified"
    ov = data.get("overview") or {}

    lines: list[str] = [
        "# Audit Defense Pack",
        "",
        "## Cover Page",
        "",
        "| Field | Value |",
        "| --- | --- |",
        "| **Document title** | Audit Defense Pack |",
        f"| **Research site** | {sn} |",
        f"| **Protocol / file reference** | {pn} |",
        f"| **Generated (UTC)** | {generated} |",
        "| **Classification** | Structured protocol review export |",
        "",
        "**Confidential** — For internal QA, clinical operations, and oversight. "
        "The IRB-approved protocol, amendments, and regulatory correspondence remain authoritative.",
        "",
        "---",
        "",
        "## Protocol Overview",
        "",
        f"- **Phase:** {_audit_pack_flatten_text(ov.get('phase', ''))}",
        f"- **Indication:** {_audit_pack_flatten_text(ov.get('indication', ''))}",
        f"- **Operational complexity (assessment):** {_audit_pack_flatten_text(ov.get('complexity', ''))}",
        f"- **Site burden (assessment):** {_audit_pack_flatten_text(ov.get('site_burden', ''))}",
        "",
        "**Summary**",
        "",
        f"- {_audit_pack_flatten_text(ov.get('summary', ''))}",
        "",
        "- **Source:** Protocol (cover reference) — Overview fields from structured Protocol Review export; confirm against the approved protocol.",
        "",
        "---",
        "",
        "## Critical Risk Map",
        "",
        "Prioritized for monitoring readiness, CAPA planning, and inspection preparation. "
        "Each item includes protocol traceability from the structured review.",
        "",
        "### Critical",
        "",
    ]

    for r in data.get("critical_risks", []) or []:
        if not isinstance(r, dict):
            continue
        lines.append(f"- **{_audit_pack_flatten_text(r.get('title', ''))}**")
        lines.append(f"  - **Likelihood:** {_audit_pack_flatten_text(r.get('likelihood', ''))}")
        lines.append(f"  - **Audit impact:** {_audit_pack_flatten_text(r.get('audit_impact', ''))}")
        lines.append(_audit_pack_source_bullet(r.get("source_reference")))
        lines.append("")

    lines.extend(["### Medium", ""])
    for r in data.get("medium_risks", []) or []:
        if not isinstance(r, dict):
            continue
        lines.append(f"- **{_audit_pack_flatten_text(r.get('title', ''))}**")
        lines.append(f"  - **Likelihood:** {_audit_pack_flatten_text(r.get('likelihood', ''))}")
        lines.append(f"  - **Audit impact:** {_audit_pack_flatten_text(r.get('audit_impact', ''))}")
        lines.append(_audit_pack_source_bullet(r.get("source_reference")))
        lines.append("")

    lines.extend(["### Low", ""])
    for r in data.get("low_risks", []) or []:
        if not isinstance(r, dict):
            continue
        lines.append(f"- **{_audit_pack_flatten_text(r.get('title', ''))}**")
        lines.append(f"  - **Likelihood:** {_audit_pack_flatten_text(r.get('likelihood', ''))}")
        lines.append(f"  - **Audit impact:** {_audit_pack_flatten_text(r.get('audit_impact', ''))}")
        lines.append(_audit_pack_source_bullet(r.get("source_reference")))
        lines.append("")

    lines.extend(
        [
            "---",
            "",
            "## Operational Control Checklist",
            "",
            "Each control lists verification expectation, cadence, responsible role, and protocol reference.",
            "",
            "### Pre-Visit",
            "",
        ]
    )
    ch = data.get("checklist") or {}
    for row in ch.get("pre_visit") or []:
        r = _normalize_checklist_row(row)
        lines.append(f"- **{r['item']}**")
        lines.append(f"  - **Verification:** {r['verification_method']}")
        lines.append(f"  - **Frequency:** {r['frequency']} · **Role:** {r['responsible_role']}")
        lines.append(_audit_pack_source_bullet(r.get("source_reference")))
        lines.append("")

    lines.extend(["### During Visit", ""])
    for row in ch.get("during_visit") or []:
        r = _normalize_checklist_row(row)
        lines.append(f"- **{r['item']}**")
        lines.append(f"  - **Verification:** {r['verification_method']}")
        lines.append(f"  - **Frequency:** {r['frequency']} · **Role:** {r['responsible_role']}")
        lines.append(_audit_pack_source_bullet(r.get("source_reference")))
        lines.append("")

    lines.extend(["### Post-Visit", ""])
    for row in ch.get("post_visit") or []:
        r = _normalize_checklist_row(row)
        lines.append(f"- **{r['item']}**")
        lines.append(f"  - **Verification:** {r['verification_method']}")
        lines.append(f"  - **Frequency:** {r['frequency']} · **Role:** {r['responsible_role']}")
        lines.append(_audit_pack_source_bullet(r.get("source_reference")))
        lines.append("")

    lines.extend(["---", "", "## This Week Action Plan", ""])
    for row in data.get("this_week_actions", []) or []:
        if isinstance(row, str):
            row = {"action": row, "source_reference": {}}
        if not isinstance(row, dict):
            continue
        lines.append(f"- **{_audit_pack_flatten_text(row.get('action', ''))}**")
        lines.append(f"  - **Verification:** {_audit_pack_flatten_text(row.get('verification_method', ''))}")
        lines.append(
            f"  - **Frequency:** {_audit_pack_flatten_text(row.get('frequency', ''))} · "
            f"**Role:** {_audit_pack_flatten_text(row.get('responsible_role', ''))}"
        )
        lines.append(_audit_pack_source_bullet(row.get("source_reference")))
        lines.append("")

    lines.extend(["---", "", "## Audit Red Flags", ""])
    for row in data.get("audit_red_flags", []) or []:
        if isinstance(row, str):
            row = {"flag": row, "source_reference": {}}
        if not isinstance(row, dict):
            continue
        lines.append(f"- **{_audit_pack_flatten_text(row.get('flag', ''))}**")
        lines.append(f"  - **Monitor / auditor concern:** {_audit_pack_flatten_text(row.get('why_flagged', ''))}")
        lines.append(f"  - **Evidence typically requested:** {_audit_pack_flatten_text(row.get('evidence_expected', ''))}")
        lines.append(_audit_pack_source_bullet(row.get("source_reference")))
        lines.append("")

    lines.extend(
        [
            "---",
            "",
            "## Audit Readiness Statement",
            "",
            "- This pack records operational and compliance considerations linked to the structured protocol "
            "review data above.",
            "- All study conduct must align with the IRB-approved protocol, informed consent, applicable "
            "regulations, and sponsor requirements.",
            "- Checklist items require appropriate delegation, training, contemporaneous source documentation, "
            "and quality systems consistent with ICH GCP.",
            "- **Source:** entries must be validated against the current approved protocol and amendments before "
            "filing or presentation to monitors or inspectors.",
            "",
            "For monitoring and inspections, retain verifiable evidence of execution (dated logs, signed records, "
            "query resolution, chain-of-custody or temperature records where applicable, and relevant correspondence).",
            "",
            "---",
            "",
            "## Traceability Appendix",
            "",
            "Distinct protocol references (`source_reference`) cited in this pack:",
            "",
        ]
    )
    for sec, desc in _collect_traceability_index(data):
        lines.append(f"- **Source:** {sec} — {desc}")

    return "\n".join(lines).strip()


class AuditPackExportRequest(BaseModel):
    protocol_data: dict[str, Any]
    protocol_name: str | None = None
    site_name: str | None = None


# --- Site Certification (in-memory MVP; no DB) ---
cert_sessions: dict[str, dict[str, Any]] = {}

# Visit Log (Protocol Review) — in-memory MVP; no PHI; restart clears list
visit_logs: list[dict[str, Any]] = []

# Operations Dashboard — protocol review snapshots (per successful structured JSON)
protocol_snapshots: list[dict[str, Any]] = []
audit_pack_export_count: int = 0

# Inspection Readiness — logic in inspection_engine.py
inspection_state: dict[str, Any] = (
    inspection_engine.default_inspection_state()
    if inspection_engine
    else {
        "site_id": "demo-site",
        "study_id": "optional",
        "last_updated": "",
        "score": {},
        "findings": [],
        "checklist": [],
        "documents": [],
        "simulation_sessions": [],
        "audit_pack": {},
    }
)


def _merge_inspection_checklist(stored: list[dict[str, Any]] | None, template: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Preserve user status from stored rows; align structure to current template (new items, fields)."""
    import copy

    by_id = {str(x.get("id")): x for x in (stored or []) if x.get("id")}
    out: list[dict[str, Any]] = []
    for row in template:
        tid = str(row.get("id", ""))
        base = copy.deepcopy(row)
        prev = by_id.get(tid)
        if prev:
            base["status"] = prev.get("status", base.get("status", "incomplete"))
        out.append(base)
    template_ids = {str(r.get("id")) for r in template}
    for sid, prev in by_id.items():
        if sid not in template_ids:
            out.append(copy.deepcopy(prev))
    return out


def _merge_inspection_documents(stored: list[dict[str, Any]] | None, template: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Preserve operational matrix edits; align rows to current template."""
    import copy

    by_id = {str(x.get("id")): x for x in (stored or []) if x.get("id")}
    out: list[dict[str, Any]] = []
    for row in template:
        tid = str(row.get("id", ""))
        base = copy.deepcopy(row)
        prev = by_id.get(tid)
        if prev:
            st = prev.get("status", base.get("status", "missing"))
            if st in ("uploaded", "missing", "needs_review"):
                base["status"] = st
            try:
                sc = int(prev.get("completeness_score", base.get("completeness_score", 0)))
                base["completeness_score"] = max(0, min(100, sc))
            except (TypeError, ValueError):
                pass
        out.append(base)
    template_ids = {str(r.get("id")) for r in template}
    for sid, prev in by_id.items():
        if sid not in template_ids:
            out.append(copy.deepcopy(prev))
    return out


def _record_protocol_snapshot(protocol_data: dict[str, Any]) -> None:
    ov = protocol_data.get("overview") if isinstance(protocol_data.get("overview"), dict) else {}
    protocol_snapshots.append(
        {
            "critical": len(protocol_data.get("critical_risks") or []),
            "medium": len(protocol_data.get("medium_risks") or []),
            "low": len(protocol_data.get("low_risks") or []),
            "complexity": str(ov.get("complexity", "") or "").strip().lower(),
            "site_burden": str(ov.get("site_burden", "") or "").strip().lower(),
            "indication": str(ov.get("indication", "") or "").strip(),
            "audit_pack_generated": False,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        }
    )


def _mark_audit_pack_on_latest_snapshot() -> None:
    global audit_pack_export_count
    audit_pack_export_count += 1
    if protocol_snapshots:
        protocol_snapshots[-1]["audit_pack_generated"] = True


def _dash_status_label(status: str) -> str:
    return {"red": "At Risk", "yellow": "Needs Attention", "green": "On Track"}.get(status, "—")


def _dash_worst_status(*statuses: str) -> str:
    order = {"green": 0, "yellow": 1, "red": 2}
    return max(statuses, key=lambda s: order.get(s, 0))


def _risk_status_for_snapshot(s: dict[str, Any]) -> str:
    c = int(s.get("critical", 0))
    m = int(s.get("medium", 0))
    comp = str(s.get("complexity") or "").strip().lower()
    bur = str(s.get("site_burden") or "").strip().lower()
    if c >= 3 or (comp == "high" and bur == "high"):
        return "red"
    if 1 <= c <= 2 or m >= 3:
        return "yellow"
    if c == 0 and m < 3:
        return "green"
    return "yellow"


def _visit_matches_indication(log: dict[str, Any], indication: str) -> bool:
    p = str(log.get("protocol") or "").strip().lower()
    ind = (indication or "").strip().lower()
    if len(p) < 2 or len(ind) < 2:
        return False
    return ind in p or p in ind


def _is_high_risk_snapshot(s: dict[str, Any]) -> bool:
    return int(s.get("critical", 0)) > 0 or int(s.get("medium", 0)) >= 4


def _count_high_risk_without_visit_logs() -> int:
    """High-risk protocol reviews with no matching Visit Log rows (match on indication vs protocol field)."""
    hrs = [s for s in protocol_snapshots if _is_high_risk_snapshot(s)]
    if not hrs:
        return 0
    if not visit_logs:
        return len(hrs)
    n = 0
    for s in hrs:
        ind = str(s.get("indication") or "").strip()
        if not ind:
            continue
        if not any(_visit_matches_indication(v, ind) for v in visit_logs):
            n += 1
    return n


def _cert_playbook_gaps() -> bool:
    """True if any certification session has incomplete SOP / training / checklist attestation."""
    if not cert_sessions:
        return False
    for st in cert_sessions.values():
        if not (
            bool(st.get("sop_completed"))
            and bool(st.get("training_completed"))
            and bool(st.get("checklist_verified"))
        ):
            return True
    return False


def _static_playbook_sections_available() -> tuple[bool, bool, bool]:
    """Site Playbook sections ship with the app; always available in this build."""
    return True, True, True


def build_dashboard_summary() -> dict[str, Any]:
    n_snap = len(protocol_snapshots)
    tot_crit = sum(int(s.get("critical", 0)) for s in protocol_snapshots)
    tot_med = sum(int(s.get("medium", 0)) for s in protocol_snapshots)
    tot_low = sum(int(s.get("low", 0)) for s in protocol_snapshots)
    high_risk = sum(1 for s in protocol_snapshots if _is_high_risk_snapshot(s))

    nv = len(visit_logs)
    n_done = sum(1 for v in visit_logs if v.get("completed"))
    n_ver = sum(1 for v in visit_logs if v.get("verified"))
    completion_pct = int(round(100 * n_done / nv)) if nv else 0
    verification_pct = int(round(100 * n_ver / nv)) if nv else 0
    unverified = sum(1 for v in visit_logs if not v.get("verified"))

    without_pack = sum(1 for s in protocol_snapshots if not s.get("audit_pack_generated"))
    high_risk_no_logs = _count_high_risk_without_visit_logs()
    open_controls = 0
    missing_visit_logs_flag = 1 if (n_snap > 0 and nv == 0) else 0

    sop_a, train_a, chk_a = _static_playbook_sections_available()
    packs = audit_pack_export_count
    cert_gaps = _cert_playbook_gaps()

    # --- Risk overview status ---
    if n_snap == 0:
        risk_status = "green"
        risk_expl = "No protocol reviews recorded this session yet."
    else:
        per = [_risk_status_for_snapshot(s) for s in protocol_snapshots]
        risk_status = _dash_worst_status(*per)
        if risk_status == "red":
            reds = sum(1 for s in protocol_snapshots if _risk_status_for_snapshot(s) == "red")
            risk_expl = (
                f"{reds} reviewed protocol(s) hit red thresholds (3+ critical risks, or high complexity with high site burden)."
                if reds
                else "Elevated protocol risk versus targets."
            )
        elif risk_status == "yellow":
            risk_expl = (
                "One or more reviews show 1–2 critical risks or 3+ medium risks; review mitigation and monitoring."
            )
        else:
            risk_expl = (
                "Reviewed protocols are within green thresholds (no critical risks and fewer than 3 medium risks each)."
            )

    # --- Visit execution status ---
    vr = (n_ver / nv) if nv else None
    if nv == 0:
        visit_status = "yellow"
        visit_expl = "No visits logged yet; add Visit Log entries to measure verification."
    elif unverified > 2 or (vr is not None and vr < 0.70):
        visit_status = "red"
        visit_expl = (
            f"Verification rate is {verification_pct}% with {unverified} unverified visit(s); target ≥90% and ≤2 unverified."
        )
    elif vr is not None and vr < 0.90:
        visit_status = "yellow"
        visit_expl = f"Verification rate is {verification_pct}%; target ≥90% for green status."
    else:
        visit_status = "green"
        visit_expl = f"Verification rate is {verification_pct}% across {nv} logged visit(s)."

    # --- Compliance alerts status ---
    compliance_red = without_pack > 0 or high_risk_no_logs > 0
    if compliance_red:
        comp_status = "red"
        parts: list[str] = []
        if without_pack:
            parts.append(
                f"{without_pack} protocol review run(s) have no Audit Defense Pack export yet."
            )
        if high_risk_no_logs:
            parts.append(
                f"{high_risk_no_logs} high-risk review(s) have no matching Visit Log entries (match protocol name to indication)."
            )
        comp_expl = " ".join(parts) if parts else "Documentation or execution gaps need attention."
    elif unverified > 0 or open_controls > 0 or missing_visit_logs_flag:
        comp_status = "yellow"
        comp_expl = (
            "Some follow-ups remain (unverified visits, no execution logs while protocols exist, or open controls) but no severe documentation gap."
        )
    else:
        comp_status = "green"
        comp_expl = "No major compliance gaps flagged for this session snapshot."

    # --- Audit readiness status ---
    if packs == 0 or not (sop_a and train_a and chk_a):
        audit_status = "red"
        audit_expl = (
            "Export at least one Audit Defense Pack after a successful Protocol Review."
            if packs == 0
            else "A required playbook section is not available in this build."
        )
    elif cert_gaps:
        audit_status = "yellow"
        audit_expl = (
            "Audit Pack(s) have been generated; complete Site Certification steps (SOP, training, checklist) for full readiness tracking."
        )
    else:
        audit_status = "green"
        audit_expl = "Audit Pack export(s) exist and core playbook sections are available."

    return {
        "risk_overview": {
            "protocols_analyzed": n_snap,
            "high_risk_protocols": high_risk,
            "critical_risks": tot_crit,
            "medium_risks": tot_med,
            "low_risks": tot_low,
            "status": risk_status,
            "label": _dash_status_label(risk_status),
            "explanation": risk_expl,
        },
        "visit_execution": {
            "visits_logged": nv,
            "completion_rate": completion_pct,
            "verification_rate": verification_pct,
            "unverified_visits": unverified,
            "status": visit_status,
            "label": _dash_status_label(visit_status),
            "explanation": visit_expl,
        },
        "compliance_alerts": {
            "protocols_without_audit_pack": without_pack,
            "high_risk_without_logs": high_risk_no_logs,
            "missing_visit_logs": missing_visit_logs_flag,
            "open_controls": open_controls,
            "status": comp_status,
            "label": _dash_status_label(comp_status),
            "explanation": comp_expl,
        },
        "audit_readiness": {
            "audit_packs_generated": packs,
            "sop_available": sop_a,
            "training_available": train_a,
            "checklist_available": chk_a,
            "status": audit_status,
            "label": _dash_status_label(audit_status),
            "explanation": audit_expl,
        },
    }


def _default_cert_state() -> dict[str, Any]:
    return {
        "sop_completed": False,
        "training_completed": False,
        "checklist_verified": False,
        "quiz_passed": False,
        "quiz_score": 0,
        "updated_at": "",
    }


# Public quiz items (no correct index exposed in GET)
CERT_QUIZ_ITEMS: list[dict[str, Any]] = [
    {
        "id": 0,
        "prompt": "A protocol deviation is best defined as:",
        "options": [
            "Any adverse event experienced by a participant",
            "A departure from the IRB-approved protocol not prospectively approved when required",
            "Any laboratory value outside the reference range",
            "A visit scheduled outside business hours",
        ],
    },
    {
        "id": 1,
        "prompt": "Under ICH GCP, the Principal Investigator’s overarching duty includes:",
        "options": [
            "Data entry for all subjects",
            "Overall trial conduct and protection of the rights, safety, and well-being of subjects",
            "Negotiation of the clinical trial agreement only",
            "Shipping investigational product only",
        ],
    },
    {
        "id": 2,
        "prompt": "Source data should generally be:",
        "options": [
            "Attributable, legible, contemporaneous, original, accurate, complete, consistent, enduring, available (ALCOA+)",
            "Entered only at study close-out",
            "Maintained solely by the sponsor in all cases",
            "Destroyed after database lock",
        ],
    },
    {
        "id": 3,
        "prompt": "Protocol-specific training for delegated tasks should be documented:",
        "options": [
            "Only after a monitoring visit",
            "Before staff perform those delegated tasks",
            "Only for the Principal Investigator",
            "Only if required by the pharmacy",
        ],
    },
    {
        "id": 4,
        "prompt": "Important protocol deviations typically require:",
        "options": [
            "No documentation if corrected the same day",
            "Assessment per sponsor/IRB policy and timely reporting when criteria are met",
            "Public posting on the site website",
            "Approval only from the laboratory director",
        ],
    },
]

# Correct option index per question id (0..4)
CERT_QUIZ_CORRECT: list[int] = [1, 1, 0, 1, 1]


def _grade_cert_quiz(answers: list[int]) -> tuple[bool, int, int]:
    """Return (passed, correct_count, total). Pass = ≥75% correct."""
    total = len(CERT_QUIZ_CORRECT)
    if len(answers) != total:
        return False, 0, total
    correct = sum(1 for i, a in enumerate(answers) if 0 <= a < len(CERT_QUIZ_ITEMS[i]["options"]) and a == CERT_QUIZ_CORRECT[i])
    need = max(1, (total * 3 + 3) // 4)  # ceil(0.75 * total)
    return correct >= need, correct, total


def build_site_certificate_markdown(
    *,
    site_name: str,
    signatory_name: str,
    quiz_score: int,
    quiz_total: int,
) -> str:
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    sn = _str(site_name).strip() or "Research site"
    sig = _str(signatory_name).strip() or "Authorized representative"
    lines = [
        "# Site Operational Readiness Certificate",
        "",
        f"**Issued:** {generated}",
        f"**Site:** {sn}",
        "",
        "## Attestations",
        "",
        "- **SOP — Protocol deviation prevention:** Reviewed and acknowledged complete.",
        "- **Training module (protocol execution & deviations):** Completed.",
        "- **Knowledge check:** Passed (" + f"{quiz_score}/{quiz_total}" + " correct).",
        "- **Operational checklists:** Site confirms daily/weekly control sheets are in use for active studies.",
        "",
        "## Statement",
        "",
        "The named representative attests that the site has completed the ClinIQ Site Certification steps "
        "in effect at the time of issuance. Ongoing compliance remains the responsibility of site leadership, "
        "the Principal Investigator, and qualified personnel, per the IRB-approved protocol, applicable regulations, "
        "and sponsor requirements.",
        "",
        f"**Authorized signatory (typed name):** {sig}",
        "",
        "## Manual signature (wet ink)",
        "",
        "Name: _______________________________________________",
        "",
        "Role: _______________________________________________",
        "",
        "Signature: _______________________________________________",
        "",
        "Date: _______________________________________________",
        "",
        "---",
        "",
        "*This certificate is generated by ClinIQ for internal site use. It does not replace regulatory, IRB, or sponsor approvals.*",
    ]
    return "\n".join(lines)


class CertStateRequest(BaseModel):
    session_id: str | None = None
    patch: dict[str, Any] = {}


class QuizGradeRequest(BaseModel):
    answers: list[int]


class CertificateRequest(BaseModel):
    session_id: str
    site_name: str = ""
    signatory_name: str = ""
    sop_completed: bool = False
    training_completed: bool = False
    checklist_verified: bool = False
    quiz_answers: list[int] = []
    output_format: str = "markdown"  # markdown | pdf


class PlaybookPdfRequest(BaseModel):
    title: str
    body_markdown: str
    doc_kind: str = "general"  # general | checklist_daily | checklist_weekly


class VisitLogRequest(BaseModel):
    protocol: str = ""
    visit_type: str = ""
    date: str = ""
    completed: bool = False
    verified: bool = False
    crc: str = ""
    notes: str = ""


def _call_anthropic_raw(
    *,
    system: str,
    user_content: str,
    max_tokens: int = 2048,
    temperature: float | None = 0.2,
) -> str:
    if not client:
        raise HTTPException(status_code=500, detail="Anthropic API key is not configured in the backend.")
    try:
        kwargs: dict[str, Any] = {
            "model": MODEL,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user_content}],
        }
        if temperature is not None:
            kwargs["temperature"] = temperature
        response = client.messages.create(**kwargs)
        return _text_from_message_response(response)
    except HTTPException:
        raise
    except Exception as e:
        logging.error("Anthropic API error: %s", e)
        raise HTTPException(status_code=500, detail=f"API error: {str(e)}") from e


def run_protocol_json_flow(user_content: str) -> tuple[str, dict[str, Any] | None, str | None]:
    """
    Returns (reply_markdown_or_raw, protocol_data, detail).
    detail is set when JSON failed after retry (reply is raw model text).
    """
    wrapper = (
        f"{user_content}\n\n---\nAnalyze the provided protocol and return structured JSON.\n\n"
        f"Return valid JSON matching this schema exactly:\n{PROTOCOL_JSON_SCHEMA_DOC}\n\n"
        "IMPORTANT:\n"
        "- Risks: audit_impact, likelihood (high|medium|low), source_reference.\n"
        "- Checklist items: item, verification_method, frequency, responsible_role, source_reference.\n"
        "- this_week_actions: action + verification_method + frequency + responsible_role + source_reference.\n"
        "- audit_red_flags: flag + why_flagged + evidence_expected + source_reference.\n"
        "- Every item must be auditable (verifiable with evidence).\n"
        "- Do not return markdown; return JSON only; no code fences.\n"
    )
    raw1 = _call_anthropic_raw(
        system=PROTOCOL_JSON_SYSTEM,
        user_content=wrapper,
        max_tokens=8192,
        temperature=0.2,
    )
    data = _try_parse_protocol_json(raw1)
    if data is not None:
        return protocol_data_to_markdown(data), data, None

    repair = (
        "The following text was supposed to be a single valid JSON object for a protocol review. "
        "Return ONLY corrected valid JSON matching the schema. No markdown, no fences, no commentary.\n\n"
        f"SCHEMA:\n{PROTOCOL_JSON_SCHEMA_DOC}\n\nINVALID OUTPUT:\n{raw1[:14000]}"
    )
    raw2 = _call_anthropic_raw(
        system=PROTOCOL_JSON_REPAIR_SYSTEM,
        user_content=repair,
        max_tokens=8192,
        temperature=0.0,
    )
    data = _try_parse_protocol_json(raw2)
    if data is not None:
        return protocol_data_to_markdown(data), data, None

    return raw1, None, "Protocol JSON parsing failed"


def _last_user_content(messages: list) -> str:
    for m in reversed(messages):
        if isinstance(m, dict) and m.get("role") == "user":
            c = m.get("content", "")
            if isinstance(c, str):
                return c
            if isinstance(c, list):
                parts: list[str] = []
                for block in c:
                    if isinstance(block, dict) and block.get("type") == "text":
                        parts.append(str(block.get("text", "")))
                return "\n".join(parts)
    return ""

if not API_KEY or API_KEY == "sk-ant-...":
    logging.warning("ANTHROPIC_API_KEY is missing or invalid in .env")
    client = None
else:
    client = anthropic.Anthropic(api_key=API_KEY)


class ChatRequest(BaseModel):
    system: str = ""
    messages: list
    mode: str | None = None


def _text_from_message_response(response) -> str:
    parts: list[str] = []
    for block in response.content:
        if block.type == "text":
            parts.append(block.text)
    return "".join(parts).strip()


def _call_anthropic_messages(
    *, system: str, messages: list, temperature: float | None = None
) -> str:
    if not client:
        raise HTTPException(status_code=500, detail="Anthropic API key is not configured in the backend.")
    try:
        kwargs: dict = {
            "model": MODEL,
            "max_tokens": 2048,
            "system": system,
            "messages": messages,
        }
        if temperature is not None:
            kwargs["temperature"] = temperature
        response = client.messages.create(**kwargs)
        return _text_from_message_response(response)
    except HTTPException:
        raise
    except Exception as e:
        logging.error("Anthropic API error: %s", e)
        raise HTTPException(status_code=500, detail=f"API error: {str(e)}") from e


def _call_anthropic_single(*, system: str, user_content: str, temperature: float = 0.3) -> str:
    return _call_anthropic_messages(
        system=system,
        messages=[{"role": "user", "content": user_content}],
        temperature=temperature,
    )


def extract_text_from_bytes(content: bytes, filename: str) -> str:
    name = (filename or "upload").lower()
    ext = Path(name).suffix
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type. Use PDF, DOCX, or TXT.")

    if ext == ".txt":
        return content.decode("utf-8", errors="replace")

    if ext == ".pdf":
        doc = fitz.open(stream=content, filetype="pdf")
        try:
            return "\n\n".join(page.get_text("text") for page in doc)
        finally:
            doc.close()

    if ext == ".docx":
        doc = Document(io.BytesIO(content))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text)

    raise ValueError("Unsupported file type.")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def serve_index():
    index_file = os.path.join(static_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h1>Static index.html not found</h1>", status_code=404)


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    raw_name = file.filename or "upload"
    ext = Path(raw_name.lower()).suffix
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, and TXT are allowed (legacy .doc is not supported; save as DOCX).",
        )

    temp_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{Path(raw_name).name}"
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file.")

        with open(temp_path, "wb") as f:
            f.write(content)

        try:
            text = extract_text_from_bytes(content, raw_name)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

        if not text.strip():
            raise HTTPException(status_code=422, detail="Could not extract text from the file.")

        logging.info("Processed %s (%s chars)", raw_name, len(text))
        return {
            "success": True,
            "filename": file.filename,
            "text": text[:MAX_DOC_CHARS],
            "truncated": len(text) > MAX_DOC_CHARS,
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Upload failed for %s", raw_name)
        raise HTTPException(status_code=500, detail="Error processing the file") from e
    finally:
        temp_path.unlink(missing_ok=True)


@app.post("/api/chat")
async def chat_json(req: ChatRequest):
    """JSON chat used by static/index.html (user/assistant messages)."""
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty.")

    if req.mode == "protocol":
        user_blob = _last_user_content(req.messages)
        if not user_blob.strip():
            raise HTTPException(status_code=400, detail="No user message content for protocol review.")
        reply, protocol_data, detail = run_protocol_json_flow(user_blob)
        if protocol_data is not None:
            _record_protocol_snapshot(protocol_data)
        out: dict[str, Any] = {"success": True, "reply": reply, "protocol_data": protocol_data}
        if detail:
            out["detail"] = detail
        return out

    system = req.system or PROMPTS["contract"]
    reply = _call_anthropic_messages(system=system, messages=req.messages)
    return {"success": True, "reply": reply}


@app.post("/api/chat/form")
async def chat_form(
    message: str = Form(...),
    mode: str = Form("contract"),
    document_text: str | None = Form(None),
):
    """Form-based chat for simple clients or curl tests."""
    message = (message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message cannot be empty.")

    content = message
    if document_text and document_text.strip():
        content = f"ATTACHED DOCUMENT:\n{document_text.strip()}\n\n---\nQUESTION: {message}"

    if mode == "protocol":
        reply, protocol_data, detail = run_protocol_json_flow(content)
        if protocol_data is not None:
            _record_protocol_snapshot(protocol_data)
        out: dict[str, Any] = {"success": True, "reply": reply, "protocol_data": protocol_data}
        if detail:
            out["detail"] = detail
        return out

    system_prompt = PROMPTS.get(mode, PROMPTS["contract"])
    reply = _call_anthropic_single(system=system_prompt, user_content=content)
    return {"success": True, "reply": reply}


@app.post("/api/export/audit-pack")
async def export_audit_pack(req: AuditPackExportRequest):
    """Generate a formal Audit Defense Pack (Markdown) from structured protocol_data."""
    normalized = validate_and_normalize_protocol_data(req.protocol_data)
    if normalized is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or incomplete protocol_data. Export requires a successful Protocol Review JSON response.",
        )
    md = build_audit_pack_markdown(
        normalized,
        protocol_name=req.protocol_name or "",
        site_name=req.site_name or "",
    )
    _mark_audit_pack_on_latest_snapshot()
    filename = "ClinIQ-Audit-Defense-Pack.md"
    return Response(
        content=md.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@app.get("/api/dashboard/summary")
def dashboard_summary():
    """Aggregated metrics from in-memory protocol snapshots and visit logs."""
    return build_dashboard_summary()


@app.get("/api/dashboard/visits")
def dashboard_visits():
    return {"entries": list(visit_logs), "count": len(visit_logs)}


@app.get("/api/dashboard/protocols")
def dashboard_protocols():
    return {"snapshots": list(protocol_snapshots), "count": len(protocol_snapshots)}

@app.get('/api/inspection/bootstrap')
def inspection_bootstrap():
    import copy

    global inspection_state
    if inspection_engine:
        inspection_state["checklist"] = _merge_inspection_checklist(
            inspection_state.get("checklist"), inspection_engine.CHECKLIST_SEED
        )
        inspection_state["documents"] = _merge_inspection_documents(
            inspection_state.get("documents"), inspection_engine.DOCUMENT_MATRIX_SEED
        )
    return {
        "categories": list(inspection_engine.INSPECTION_CATEGORIES) if inspection_engine else [],
        "sources": list(inspection_engine.INSPECTION_SOURCES) if inspection_engine else [],
        "checklist_template": copy.deepcopy(inspection_engine.CHECKLIST_SEED) if inspection_engine else [],
        "simulation_questions": list(inspection_engine.INSPECTION_SIMULATION_QUESTIONS) if inspection_engine else [],
        "document_matrix_template": copy.deepcopy(inspection_engine.DOCUMENT_MATRIX_SEED) if inspection_engine else [],
        "inspection_state": copy.deepcopy(inspection_state),
    }
@app.post('/api/inspection/state')
async def inspection_state_post(request: Request):
    global inspection_state
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail='Expected JSON object')
    allowed = {'site_id', 'study_id', 'last_updated', 'score', 'findings', 'checklist', 'documents', 'simulation_sessions', 'audit_pack'}
    for k, v in body.items():
        if k in allowed:
            inspection_state[k] = v
    return {'success': True, 'inspection_state': inspection_state}
@app.post('/api/inspection/run-check')
def inspection_run_check():
    global inspection_state
    if not inspection_engine:
        raise HTTPException(status_code=503, detail="Inspection engine not available")
    cl = inspection_state.get("checklist") or []
    result = inspection_engine.compute_inspection_run(cl)
    inspection_state["score"] = result["score"]
    inspection_state["findings"] = result["findings"]
    inspection_state["last_updated"] = datetime.now(timezone.utc).isoformat()
    return {"score": inspection_state["score"], "findings": inspection_state["findings"]}
@app.post('/api/export/inspection-pack')
def export_inspection_pack():
    if not inspection_engine:
        raise HTTPException(status_code=503, detail="Inspection engine not available")
    ts = datetime.now(timezone.utc).isoformat()
    inspection_state["audit_pack"] = {"last_export": ts}
    md = inspection_engine.build_inspection_pack_markdown(inspection_state)
    return Response(
        content=md.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="ClinIQ-Inspection-Pack.md"'},
    )


@app.get("/api/certification/quiz")
def certification_quiz_questions():
    """Multiple-choice items for Site Certification (correct answers not included)."""
    return {
        "questions": [
            {"id": q["id"], "prompt": q["prompt"], "options": q["options"]} for q in CERT_QUIZ_ITEMS
        ]
    }


@app.post("/api/certification/state")
def certification_state_post(req: CertStateRequest):
    """Merge patch into in-memory certification session."""
    sid = (req.session_id or "").strip() or str(uuid.uuid4())
    cert_sessions.setdefault(sid, _default_cert_state())
    allowed_bool = {"sop_completed", "training_completed", "checklist_verified", "quiz_passed"}
    for k, v in (req.patch or {}).items():
        if k in allowed_bool:
            cert_sessions[sid][k] = bool(v)
        elif k == "quiz_score":
            try:
                cert_sessions[sid]["quiz_score"] = int(v)
            except (TypeError, ValueError):
                pass
    cert_sessions[sid]["updated_at"] = datetime.now(timezone.utc).isoformat()
    return {"session_id": sid, "state": cert_sessions[sid]}


@app.get("/api/certification/state/{session_id}")
def certification_state_get(session_id: str):
    st = cert_sessions.get(session_id.strip())
    if not st:
        raise HTTPException(status_code=404, detail="Unknown certification session.")
    return {"session_id": session_id, "state": st}


@app.post("/api/certification/quiz-grade")
def certification_quiz_grade(req: QuizGradeRequest):
    """Score quiz; pass if ≥75% correct."""
    passed, score, total = _grade_cert_quiz(req.answers)
    need = max(1, (total * 3 + 3) // 4)
    return {"passed": passed, "score": score, "total": total, "required_correct": need}


@app.post("/api/certification/certificate")
def certification_certificate(req: CertificateRequest):
    """Issue downloadable certificate (Markdown) when all steps and quiz pass."""
    if not req.sop_completed or not req.training_completed or not req.checklist_verified:
        raise HTTPException(
            status_code=400,
            detail="Complete steps 1, 2, and 4 (SOP, Training, checklist confirmation) before generating a certificate.",
        )
    passed, score, total = _grade_cert_quiz(req.quiz_answers)
    if not passed:
        raise HTTPException(
            status_code=400,
            detail=f"Knowledge check not passed ({score}/{total} correct). Pass at least 75% to continue.",
        )
    sid = req.session_id.strip()
    if sid in cert_sessions:
        cert_sessions[sid].update(
            {
                "sop_completed": True,
                "training_completed": True,
                "checklist_verified": True,
                "quiz_passed": True,
                "quiz_score": score,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    md = build_site_certificate_markdown(
        site_name=req.site_name,
        signatory_name=req.signatory_name,
        quiz_score=score,
        quiz_total=total,
    )
    fmt = (req.output_format or "markdown").strip().lower()
    if fmt == "pdf":
        if operational_pdf is None:
            raise HTTPException(
                status_code=503,
                detail="PDF generation unavailable. Install reportlab (pip install reportlab).",
            )
        pdf_bytes = operational_pdf.build_markdown_document_pdf(
            "Site Operational Readiness Certificate",
            md,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="ClinIQ-Site-Certification.pdf"'},
        )
    return Response(
        content=md.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="ClinIQ-Site-Certification.md"'},
    )


@app.post("/api/export/playbook-pdf")
def export_playbook_pdf(req: PlaybookPdfRequest):
    """Printable PDF for Site Playbooks with signature block (and checklist attestation when applicable)."""
    if operational_pdf is None:
        raise HTTPException(
            status_code=503,
            detail="PDF generation unavailable. Install reportlab (pip install reportlab).",
        )
    kind = (req.doc_kind or "general").strip().lower()
    if kind not in ("general", "checklist_daily", "checklist_weekly"):
        kind = "general"
    try:
        pdf_bytes = operational_pdf.build_playbook_operational_pdf(
            req.title.strip() or "Site Playbook",
            req.body_markdown,
            kind,  # type: ignore[arg-type]
        )
    except Exception as e:
        logging.exception("playbook PDF build failed")
        raise HTTPException(status_code=500, detail=f"PDF build failed: {e!s}") from e
    safe = re.sub(r"[^\w\-]+", "_", (req.title.strip() or "ClinIQ-Playbook")[:60]).strip("_") or "ClinIQ-Playbook"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe}.pdf"'},
    )


@app.post("/api/visit-log")
def post_visit_log(req: VisitLogRequest):
    """Append a visit log entry (in-memory; cleared on server restart)."""
    entry: dict[str, Any] = {
        "protocol": req.protocol.strip(),
        "visit_type": req.visit_type.strip(),
        "date": req.date.strip(),
        "completed": req.completed,
        "verified": req.verified,
        "crc": req.crc.strip(),
        "notes": req.notes.strip(),
    }
    visit_logs.append(entry)
    idx = len(visit_logs) - 1
    logging.info("visit_log saved index=%s protocol=%s", idx, entry.get("protocol", "")[:80])
    return {"success": True, "saved_index": idx, "message": "Visit record saved."}


app.mount("/static", StaticFiles(directory=static_path), name="static")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
