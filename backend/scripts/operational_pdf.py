"""
Printable, signature-ready PDFs for ClinIQ operational documents (ReportLab).
No Part 11 / digital signatures — wet-ink fields only.
"""

from __future__ import annotations

import re
from io import BytesIO
from typing import Literal
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

DocKind = Literal["general", "checklist_daily", "checklist_weekly"]


def _line_to_xml(raw_line: str) -> str:
    parts = re.split(r"(\*\*.+?\*\*)", raw_line)
    chunks: list[str] = []
    for p in parts:
        if len(p) >= 4 and p.startswith("**") and p.endswith("**"):
            chunks.append("<b>" + escape(p[2:-2]) + "</b>")
        else:
            chunks.append(escape(p))
    return "".join(chunks)


def _markdownish_to_story(md: str, styles) -> list:
    story: list = []
    normal = styles["Normal"]
    h1 = ParagraphStyle(
        "OpH1",
        parent=normal,
        fontSize=15,
        leading=18,
        spaceAfter=10,
        spaceBefore=12,
        textColor=colors.HexColor("#1c2433"),
    )
    h2 = ParagraphStyle(
        "OpH2",
        parent=normal,
        fontSize=12,
        leading=15,
        spaceAfter=8,
        spaceBefore=10,
        textColor=colors.HexColor("#2a3347"),
    )
    h3 = ParagraphStyle(
        "OpH3",
        parent=normal,
        fontSize=11,
        leading=14,
        spaceAfter=6,
        spaceBefore=8,
        textColor=colors.HexColor("#3d4a63"),
    )

    for line in md.split("\n"):
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 7))
            continue
        if stripped.startswith("### "):
            story.append(Paragraph(_line_to_xml(stripped[4:]), h3))
        elif stripped.startswith("## "):
            story.append(Paragraph(_line_to_xml(stripped[3:]), h2))
        elif stripped.startswith("# "):
            story.append(Paragraph(_line_to_xml(stripped[2:]), h1))
        elif stripped.startswith("- [ ]") or stripped.startswith("- [x]") or stripped.startswith("- [X]"):
            rest = stripped[5:].strip()
            story.append(Paragraph("&#9744; " + _line_to_xml(rest), normal))
        elif stripped.startswith("- ") or stripped.startswith("* "):
            story.append(Paragraph("&#8226; " + _line_to_xml(stripped[2:]), normal))
        else:
            story.append(Paragraph(_line_to_xml(stripped), normal))
    return story


def _append_checklist_attestation(story: list, styles) -> None:
    normal = styles["Normal"]
    head = ParagraphStyle("ChkHead", parent=normal, fontSize=11, spaceBefore=16, spaceAfter=8)
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Checklist attestation</b>", head))
    story.append(Paragraph("Reviewed by: _______________________________________________", normal))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Verified by (PI/Sub-I): _______________________________________________", normal))
    story.append(Spacer(1, 14))


def _append_signature_block(story: list, styles) -> None:
    normal = styles["Normal"]
    head = ParagraphStyle("SigHead", parent=normal, fontSize=11, spaceBefore=18, spaceAfter=10)
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Signature block</b>", head))
    story.append(Paragraph("Name: _______________________________________________", normal))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Role: _______________________________________________", normal))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Signature: _______________________________________________", normal))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Date: _______________________________________________", normal))


def build_playbook_operational_pdf(
    title: str,
    body_markdown: str,
    doc_kind: DocKind = "general",
) -> bytes:
    """Body + optional checklist attestation + signature block."""
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        rightMargin=inch * 0.9,
        leftMargin=inch * 0.9,
        topMargin=inch * 0.9,
        bottomMargin=inch * 0.9,
        title=title[:180],
    )
    styles = getSampleStyleSheet()
    title_sty = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontSize=17,
        leading=21,
        spaceAfter=14,
        textColor=colors.HexColor("#111827"),
    )
    story: list = [Paragraph(escape(title.strip() or "Document"), title_sty), Spacer(1, 4)]
    story.extend(_markdownish_to_story(body_markdown, styles))
    if doc_kind in ("checklist_daily", "checklist_weekly"):
        _append_checklist_attestation(story, styles)
    _append_signature_block(story, styles)
    doc.build(story)
    return buf.getvalue()


def build_markdown_document_pdf(title: str, body_markdown: str) -> bytes:
    """Single document from full markdown (e.g. certificate already includes signature lines)."""
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        rightMargin=inch * 0.9,
        leftMargin=inch * 0.9,
        topMargin=inch * 0.9,
        bottomMargin=inch * 0.9,
        title=title[:180],
    )
    styles = getSampleStyleSheet()
    title_sty = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontSize=17,
        leading=21,
        spaceAfter=14,
        textColor=colors.HexColor("#111827"),
    )
    story: list = [Paragraph(escape(title.strip() or "Document"), title_sty), Spacer(1, 4)]
    story.extend(_markdownish_to_story(body_markdown, styles))
    doc.build(story)
    return buf.getvalue()
