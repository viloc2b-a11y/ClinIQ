"""
Supabase-backed persistence for ClinIQEvent (append-only).
Env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

from .models import ClinIQEvent

_TABLE = "cliniq_events"

_client: Any = None


def _require_supabase_package() -> None:
    try:
        import supabase  # noqa: F401
    except ImportError as e:
        raise RuntimeError(
            "Supabase persistence requires the 'supabase' package. "
            "Install with: pip install supabase"
        ) from e


def _get_env_url() -> str | None:
    return os.environ.get("SUPABASE_URL") or os.environ.get(
        "NEXT_PUBLIC_SUPABASE_URL"
    )


def _get_env_key() -> str | None:
    return os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


def is_supabase_configured() -> bool:
    """True when URL and service role key are set (Supabase path will be used)."""
    return bool(_get_env_url() and _get_env_key())


def reset_client_cache() -> None:
    """Test hook: clear cached client."""
    global _client
    _client = None


def _get_client() -> Any:
    global _client
    if _client is not None:
        return _client
    _require_supabase_package()
    from supabase import create_client

    url = _get_env_url()
    key = _get_env_key()
    if not url or not key:
        raise RuntimeError(
            "Supabase URL and SUPABASE_SERVICE_ROLE_KEY must be set for persistence"
        )
    _client = create_client(url.strip(), key.strip())
    return _client


def _opt_str(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)


def _payload_copy(payload: dict[str, Any]) -> dict[str, Any]:
    return dict(payload) if payload else {}


def _event_timestamp_iso(event: ClinIQEvent) -> str:
    p = event.payload or {}
    raw = p.get("timestamp")
    if raw is None:
        dt = event.created_at
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    if isinstance(raw, datetime):
        if raw.tzinfo is None:
            raw = raw.replace(tzinfo=timezone.utc)
        return raw.astimezone(timezone.utc).isoformat()
    return str(raw)


def _row_to_event(row: dict[str, Any]) -> ClinIQEvent:
    payload = row.get("payload")
    if isinstance(payload, str):
        payload = json.loads(payload)
    if not isinstance(payload, dict):
        payload = {}

    ts_raw = row.get("event_timestamp")
    created_at = _parse_timestamptz(ts_raw)

    return ClinIQEvent(
        id=str(row["id"]),
        event_type=str(row["event_type"]),
        payload=payload,
        created_at=created_at,
    )


def _parse_timestamptz(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    if isinstance(value, str):
        s = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    raise ValueError(f"Invalid timestamptz value: {value!r}")


def insert_event(event: ClinIQEvent) -> ClinIQEvent:
    """
    Insert one row into public.cliniq_events.
    Top-level columns are extracted from payload where present; full payload is stored in jsonb.
    """
    p = _payload_copy(event.payload)
    row = {
        "id": event.id,
        "event_type": event.event_type,
        "study_id": _opt_str(p.get("study_id")),
        "subject_id": _opt_str(p.get("subject_id")),
        "visit_name": _opt_str(p.get("visit_name")),
        "event_timestamp": _event_timestamp_iso(event),
        "payload": p,
    }
    try:
        client = _get_client()
        res = (
            client.table(_TABLE)
            .insert(row)
            .select("*")
            .single()
            .execute()
        )
    except Exception as e:
        raise RuntimeError(f"Failed to insert event into {_TABLE}: {e}") from e

    data = getattr(res, "data", None)
    if not data:
        raise RuntimeError(
            f"Failed to insert event into {_TABLE}: empty response from Supabase"
        )
    try:
        return _row_to_event(data)
    except Exception as e:
        raise RuntimeError(f"Failed to parse inserted row from {_TABLE}: {e}") from e


def get_events_by_type(event_type: str) -> list[ClinIQEvent]:
    """Events with matching event_type, ordered by event_timestamp ascending."""
    try:
        client = _get_client()
        res = (
            client.table(_TABLE)
            .select("*")
            .eq("event_type", event_type)
            .order("event_timestamp", desc=False)
            .execute()
        )
    except Exception as e:
        raise RuntimeError(
            f"Failed to query {_TABLE} by event_type={event_type!r}: {e}"
        ) from e

    rows = getattr(res, "data", None) or []
    out: list[ClinIQEvent] = []
    for row in rows:
        try:
            out.append(_row_to_event(row))
        except Exception as e:
            raise RuntimeError(f"Failed to parse row from {_TABLE}: {e}") from e
    return out


def list_events(limit: int = 1000) -> list[ClinIQEvent]:
    """Recent events by event_timestamp descending."""
    if limit < 1:
        limit = 1
    try:
        client = _get_client()
        res = (
            client.table(_TABLE)
            .select("*")
            .order("event_timestamp", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception as e:
        raise RuntimeError(f"Failed to list events from {_TABLE}: {e}") from e

    rows = getattr(res, "data", None) or []
    out: list[ClinIQEvent] = []
    for row in rows:
        try:
            out.append(_row_to_event(row))
        except Exception as e:
            raise RuntimeError(f"Failed to parse row from {_TABLE}: {e}") from e
    return out


def clear_events() -> None:
    """Delete all rows (local/dev only). Matches all rows via created_at lower bound."""
    try:
        client = _get_client()
        client.table(_TABLE).delete().gte(
            "created_at", "1970-01-01T00:00:00+00:00"
        ).execute()
    except Exception as e:
        raise RuntimeError(f"Failed to clear {_TABLE}: {e}") from e
