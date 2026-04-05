"""
Read JSON from stdin, call log_visit, print JSON to stdout (one line).
Used by Next.js app/api/visits/log bridge.
"""

from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))


def main() -> None:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
        from api.log_visit import log_visit

        result = log_visit(payload)
        print(json.dumps(result), flush=True)
    except Exception as e:
        err = {
            "ok": False,
            "error": str(e),
            "detail": traceback.format_exc(),
        }
        print(json.dumps(err), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
