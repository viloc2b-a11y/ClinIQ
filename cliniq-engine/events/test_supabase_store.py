"""
Tests use mocks only — no live Supabase required.
Run from cliniq-engine: pip install -r requirements.txt && pytest events/test_supabase_store.py
"""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest

from events.models import ClinIQEvent


def _make_response(data):
    r = MagicMock()
    r.data = data
    return r


@pytest.fixture(autouse=True)
def _memory_mode():
    """Default: no Supabase env for isolation."""
    from events import store as store_mod

    store_mod.use_in_memory_store_only()
    store_mod.clear_event_store()
    yield
    store_mod.use_in_memory_store_only()
    store_mod.clear_event_store()


def test_insert_event_maps_fields_into_row():
    from events import supabase_store

    ts = datetime(2026, 4, 4, 10, 0, 0, tzinfo=timezone.utc)
    event = ClinIQEvent(
        id="11111111-1111-4111-8111-111111111111",
        event_type="visit_completed",
        payload={
            "study_id": "S-1",
            "subject_id": "SUB-1",
            "visit_name": "V1",
            "timestamp": ts,
            "extra": 42,
        },
        created_at=ts,
    )

    captured: dict = {}
    mock_table = MagicMock()

    def fake_execute():
        captured["insert_arg"] = mock_table.insert.call_args[0][0]
        return _make_response(
            {
                "id": event.id,
                "event_type": event.event_type,
                "study_id": "S-1",
                "subject_id": "SUB-1",
                "visit_name": "V1",
                "event_timestamp": ts.isoformat(),
                "payload": event.payload,
                "created_at": ts.isoformat(),
            }
        )

    mock_table.insert.return_value.select.return_value.single.return_value.execute.side_effect = (
        fake_execute
    )
    mock_client = MagicMock()
    mock_client.table.return_value = mock_table

    with patch.dict(
        "os.environ",
        {
            "SUPABASE_URL": "http://localhost:54321",
            "SUPABASE_SERVICE_ROLE_KEY": "test-key",
        },
        clear=False,
    ):
        with patch.object(supabase_store, "reset_client_cache"):
            with patch.object(
                supabase_store,
                "_get_client",
                return_value=mock_client,
            ):
                out = supabase_store.insert_event(event)

    row = captured["insert_arg"]
    assert row["id"] == event.id
    assert row["event_type"] == "visit_completed"
    assert row["study_id"] == "S-1"
    assert row["subject_id"] == "SUB-1"
    assert row["visit_name"] == "V1"
    assert row["payload"]["extra"] == 42
    assert out.event_type == "visit_completed"
    assert out.payload["extra"] == 42


def test_get_events_by_type_ordered_ascending():
    from events import supabase_store

    rows = [
        {
            "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            "event_type": "t",
            "study_id": None,
            "subject_id": None,
            "visit_name": None,
            "event_timestamp": "2026-04-04T09:00:00+00:00",
            "payload": {"k": 1},
            "created_at": "2026-04-04T09:00:00+00:00",
        },
        {
            "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            "event_type": "t",
            "study_id": None,
            "subject_id": None,
            "visit_name": None,
            "event_timestamp": "2026-04-04T11:00:00+00:00",
            "payload": {"k": 2},
            "created_at": "2026-04-04T11:00:00+00:00",
        },
    ]

    mock_chain = MagicMock()
    mock_chain.select.return_value.eq.return_value.order.return_value.execute.return_value = (
        _make_response(rows)
    )
    mock_client = MagicMock()
    mock_client.table.return_value = mock_chain

    with patch.dict(
        "os.environ",
        {
            "SUPABASE_URL": "http://x",
            "SUPABASE_SERVICE_ROLE_KEY": "k",
        },
    ):
        with patch.object(supabase_store, "reset_client_cache"):
            with patch.object(
                supabase_store,
                "_get_client",
                return_value=mock_client,
            ):
                events = supabase_store.get_events_by_type("t")

    mock_chain.select.return_value.eq.return_value.order.assert_called_once_with(
        "event_timestamp", desc=False
    )
    assert [e.payload["k"] for e in events] == [1, 2]


def test_store_delegates_to_supabase_when_configured():
    from events import store as store_mod

    returned = ClinIQEvent(
        id="cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        event_type="visit_completed",
        payload={"study_id": "S"},
        created_at=datetime.now(timezone.utc),
    )

    with patch.dict(
        "os.environ",
        {
            "SUPABASE_URL": "http://x",
            "SUPABASE_SERVICE_ROLE_KEY": "k",
        },
    ):
        with patch(
            "events.supabase_store.insert_event",
            return_value=returned,
        ) as ins:
            out = store_mod.emit_event("visit_completed", {"study_id": "S"})
            ins.assert_called_once()
            assert out.id == returned.id
            assert len(store_mod.event_store) == 1
            assert store_mod.event_store[0].id == returned.id


def test_missing_env_uses_in_memory_only():
    from events import store as store_mod

    store_mod.use_in_memory_store_only()
    store_mod.clear_event_store()
    with patch("events.supabase_store.insert_event") as ins:
        e = store_mod.emit_event("x", {"a": 1})
        ins.assert_not_called()
        assert e.event_type == "x"
        assert store_mod.event_store[0] is e


def test_leakage_events_preserve_payload_in_jsonb():
    from events import supabase_store

    event = ClinIQEvent(
        id="dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        event_type="revenue_leakage_flagged",
        payload={
            "billable_id": "b1",
            "study_id": "ST-1",
            "visit_name": "Screening Visit",
            "activity_id": "A1",
            "activity_type": "PROC",
            "amount": 125.5,
            "billable_to": "sponsor",
            "reason": "still_pending_after_trigger_window",
        },
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )

    captured: dict = {}
    mock_table = MagicMock()

    def fake_execute():
        ins = mock_table.insert.call_args[0][0]
        captured["payload"] = ins["payload"]
        return _make_response(
            {
                "id": event.id,
                "event_type": event.event_type,
                "study_id": "ST-1",
                "subject_id": None,
                "visit_name": "Screening Visit",
                "event_timestamp": "2026-01-01T00:00:00+00:00",
                "payload": ins["payload"],
                "created_at": "2026-01-01T00:00:00+00:00",
            }
        )

    mock_table.insert.return_value.select.return_value.single.return_value.execute.side_effect = (
        fake_execute
    )
    mock_client = MagicMock()
    mock_client.table.return_value = mock_table

    with patch.dict(
        "os.environ",
        {"SUPABASE_URL": "http://x", "SUPABASE_SERVICE_ROLE_KEY": "k"},
    ):
        with patch.object(supabase_store, "reset_client_cache"):
            with patch.object(
                supabase_store,
                "_get_client",
                return_value=mock_client,
            ):
                supabase_store.insert_event(event)

    p = captured["payload"]
    assert p["amount"] == 125.5
    assert p["reason"] == "still_pending_after_trigger_window"
    assert p["activity_id"] == "A1"


def test_clear_event_store_calls_supabase_clear_when_enabled():
    from events import store as store_mod

    with patch.dict(
        "os.environ",
        {"SUPABASE_URL": "http://x", "SUPABASE_SERVICE_ROLE_KEY": "k"},
    ):
        with patch("events.supabase_store.clear_events") as clr:
            store_mod.clear_event_store()
            clr.assert_called_once()
