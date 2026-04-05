"""
Visit logging entry for app-facing integrations.
Calls finance.handlers.handle_visit_completed when expected billables are supplied;
otherwise emits a single audit event (visit_completion_received).
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from events.store import emit_event
from finance.handlers import handle_visit_completed
from soa.models import ExpectedBillable


def _require_str(d: dict[str, Any], key: str) -> str:
    v = d.get(key)
    if v is None or (isinstance(v, str) and not v.strip()):
        raise ValueError(f"Missing or empty required field: {key}")
    return str(v).strip()


def _dict_to_expected_billable(raw: dict[str, Any]) -> ExpectedBillable:
    """Deserialize JSON-compatible dict to ExpectedBillable (Decimals from str/float/int)."""
    if not isinstance(raw, dict):
        raise ValueError("Each expected_billables item must be an object")
    try:
        data = dict(raw)
        data["quantity"] = Decimal(str(data["quantity"]))
        data["unit_cost"] = Decimal(str(data["unit_cost"]))
        if not data.get("id"):
            data.pop("id", None)
        return ExpectedBillable.model_validate(data)
    except Exception as e:
        raise ValueError(f"Invalid expected_billables row: {raw!r} ({e})") from e


def _normalize_optional_str(value: Any) -> str | None:
    if value is None:
        return None
    s = str(value).strip()
    return s if s else None


def log_visit(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Validate payload, emit audit event, optionally run handle_visit_completed.

    Payload keys (snake_case):
      - study_id, subject_id, visit_name (required)
      - completed_by, timestamp (optional)
      - expected_billables (optional list[dict]): when non-empty, passed to handle_visit_completed
    """
    if not isinstance(payload, dict):
        raise TypeError("payload must be a dict")

    study_id = _require_str(payload, "study_id")
    subject_id = _require_str(payload, "subject_id")
    visit_name = _require_str(payload, "visit_name")
    completed_by = _normalize_optional_str(payload.get("completed_by"))
    timestamp = _normalize_optional_str(payload.get("timestamp"))

    audit_payload: dict[str, Any] = {
        "study_id": study_id,
        "subject_id": subject_id,
        "visit_name": visit_name,
    }
    if completed_by is not None:
        audit_payload["completed_by"] = completed_by
    if timestamp is not None:
        audit_payload["timestamp"] = timestamp

    emit_event("visit_completion_received", audit_payload)
    events_emitted = 1

    raw_billables = payload.get("expected_billables")
    triggered: list[ExpectedBillable] = []
    if isinstance(raw_billables, list) and len(raw_billables) > 0:
        billables = [_dict_to_expected_billable(x) for x in raw_billables if isinstance(x, dict)]
        if not billables:
            raise ValueError("expected_billables must contain valid objects")
        # Ensure study scoping: all rows must match request study_id
        for b in billables:
            if b.study_id != study_id:
                raise ValueError(
                    f"expected_billables study_id mismatch: {b.study_id!r} != {study_id!r}"
                )
        triggered = handle_visit_completed(visit_name, billables)
        # handle_visit_completed emits 1 visit_completed + len(triggered) billable_instance_created
        events_emitted += 1 + len(triggered)

    msg = (
        "Visit logged and billables processed"
        if triggered
        else "Visit logged successfully"
    )

    return {
        "ok": True,
        "study_id": study_id,
        "subject_id": subject_id,
        "visit_name": visit_name,
        "triggered_count": len(triggered),
        "events_emitted": events_emitted,
        "message": msg,
    }
