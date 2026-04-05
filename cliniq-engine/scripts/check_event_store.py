"""
Tiny dev check: insert one event, list events, print count.
Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and applied cliniq_events_v1.sql.

  cd cliniq-engine
  set SUPABASE_URL=...
  set SUPABASE_SERVICE_ROLE_KEY=...
  python scripts/check_event_store.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from events.models import ClinIQEvent
from events.supabase_store import insert_event, list_events


def main() -> None:
    e = ClinIQEvent(
        event_type="dev_ping",
        payload={"study_id": "DEV", "note": "check_event_store.py"},
    )
    insert_event(e)
    rows = list_events(limit=50)
    print(f"cliniq_events count (last 50 query): {len(rows)}")
    for r in rows[:5]:
        print(f"  - {r.event_type}  {r.id}")


if __name__ == "__main__":
    main()
