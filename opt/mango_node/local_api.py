"""Local HTTP dashboard API for the M.A.N.G.O. edge node.

Exposes a minimal read-only API on port 9100 so operators can inspect the
node state from the local network without touching the VPS.

Endpoints:
  GET /health          — liveness check (always 200 if process is alive)
  GET /api/latest      — most recent measurement from local SQLite DB
  GET /api/stats       — row counts: total / unsent / unsent-alerts

Uses only Python stdlib so no extra packages are needed on the Jetson TK1.

Usage::

    python3 -m mango_node.local_api
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

from .config import DB_PATH, STATION_NAME, VERBOSE
from .db import fetch_latest_readings, get_connection

PORT: int = int(os.getenv("MANGO_LOCAL_API_PORT", "9100"))


def _json(obj) -> bytes:
    return json.dumps(obj, default=str).encode()


def _stats() -> dict:
    con = get_connection()
    cur = con.cursor()
    total        = cur.execute("SELECT COUNT(*) FROM measurements").fetchone()[0]
    unsent       = cur.execute("SELECT COUNT(*) FROM measurements WHERE sent=0").fetchone()[0]
    unsent_sms   = cur.execute(
        "SELECT COUNT(*) FROM measurements WHERE alert_level != 'normal' AND sms_sent=0"
    ).fetchone()[0]
    con.close()
    return {"total": total, "unsent": unsent, "unsent_alerts_sms": unsent_sms}


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        if VERBOSE:
            super().log_message(fmt, *args)

    def _send(self, status: int, body: bytes, ct: str = "application/json") -> None:
        self.send_response(status)
        self.send_header("Content-Type", ct)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            body = _json({"status": "ok", "station": STATION_NAME, "db": DB_PATH})
            self._send(200, body)

        elif self.path == "/api/latest":
            row = fetch_latest_readings()
            if row is None:
                self._send(200, _json({"station": STATION_NAME, "latest": None}))
            else:
                self._send(200, _json({
                    "station": STATION_NAME,
                    "latest": {
                        "measured_at":  row["measured_at"],
                        "ph":           row["ph"],
                        "turbidity":    row["turbidity"],
                        "temperature":  row["temperature"],
                        "alert_level":  row["alert_level"],
                    },
                }))

        elif self.path == "/api/stats":
            self._send(200, _json({"station": STATION_NAME, **_stats()}))

        else:
            self._send(404, _json({"error": "not_found"}))


def main() -> None:
    from .db import init_db
    init_db()

    server = HTTPServer(("0.0.0.0", PORT), _Handler)
    if VERBOSE:
        print(f"[local_api] Listening on port {PORT}  station={STATION_NAME}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
