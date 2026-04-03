from __future__ import annotations

from typing import Any

from .models import ClinIQEvent

# Single in-memory log for the process lifetime.
# Shared across all FastAPI requests in the same worker process.
event_store: list[ClinIQEvent] = []


def emit_event(event_type: str, payload: dict[str, Any]) -> ClinIQEvent:
    """Create and store a ClinIQEvent. Returns the stored event."""
    event = ClinIQEvent(event_type=event_type, payload=payload)
    event_store.append(event)
    return event


def get_events_by_type(event_type: str) -> list[ClinIQEvent]:
    return [e for e in event_store if e.event_type == event_type]


def clear_event_store() -> None:
    """Test helper only — not for production use."""
    event_store.clear()
