"""Tests for api.log_visit (no live Supabase required — in-memory store)."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from events import store as store_mod


@pytest.fixture(autouse=True)
def _memory_events():
    store_mod.use_in_memory_store_only()
    store_mod.clear_event_store()
    yield
    store_mod.clear_event_store()


def test_log_visit_rejects_missing_study_id():
    from api.log_visit import log_visit

    with pytest.raises(ValueError, match="study_id"):
        log_visit({"subject_id": "S", "visit_name": "V"})


def test_log_visit_accepts_valid_minimal_payload():
    from api.log_visit import log_visit

    out = log_visit(
        {
            "study_id": "ST-1",
            "subject_id": "SUB-1",
            "visit_name": "Screening Visit",
        }
    )
    assert out["ok"] is True
    assert out["study_id"] == "ST-1"
    assert out["triggered_count"] == 0
    assert out["events_emitted"] == 1
    assert len(store_mod.event_store) == 1
    assert store_mod.event_store[0].event_type == "visit_completion_received"


def test_log_visit_calls_handle_visit_completed_with_billables():
    from api.log_visit import log_visit
    from soa.models import ExpectedBillable

    b = ExpectedBillable(
        study_id="ST-1",
        visit_name="Screening Visit",
        activity_id="A1",
        activity_type="lab",
        quantity=1,
        unit_cost=100,
        billable_to="sponsor",
    )

    with patch("api.log_visit.handle_visit_completed") as hv:
        hv.return_value = [b]
        out = log_visit(
            {
                "study_id": "ST-1",
                "subject_id": "SUB-1",
                "visit_name": "Screening Visit",
                "expected_billables": [
                    {
                        "id": b.id,
                        "study_id": "ST-1",
                        "visit_name": "Screening Visit",
                        "activity_id": "A1",
                        "activity_type": "lab",
                        "quantity": "1",
                        "unit_cost": "100",
                        "billable_to": "sponsor",
                        "status": "pending",
                    }
                ],
            }
        )

    hv.assert_called_once()
    call_visit, call_bills = hv.call_args[0]
    assert call_visit == "Screening Visit"
    assert len(call_bills) == 1
    assert call_bills[0].activity_id == "A1"
    assert out["triggered_count"] == 1
    assert out["events_emitted"] == 3  # audit + visit_completed + 1 billable


def test_log_visit_includes_optional_fields_in_audit_event():
    from api.log_visit import log_visit

    log_visit(
        {
            "study_id": "ST-1",
            "subject_id": "SUB-1",
            "visit_name": "V",
            "completed_by": "c@x.com",
            "timestamp": "2026-04-04T10:00:00.000Z",
        }
    )
    p = store_mod.event_store[0].payload
    assert p["completed_by"] == "c@x.com"
    assert p["timestamp"] == "2026-04-04T10:00:00.000Z"


def test_log_visit_rejects_study_mismatch_in_expected_billables():
    from api.log_visit import log_visit

    with pytest.raises(ValueError, match="study_id mismatch"):
        log_visit(
            {
                "study_id": "ST-1",
                "subject_id": "SUB-1",
                "visit_name": "V",
                "expected_billables": [
                    {
                        "study_id": "OTHER",
                        "visit_name": "V",
                        "activity_id": "A1",
                        "activity_type": "lab",
                        "quantity": "1",
                        "unit_cost": "10",
                        "billable_to": "sponsor",
                    }
                ],
            }
        )
