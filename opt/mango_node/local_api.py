"""Local HTTP API for the M.A.N.G.O. edge node.

Exposes a read-only API on port 9100 for local-network inspection
without touching the VPS. Uses only Python stdlib.

Endpoints:
  GET /health              — liveness check
  GET /api/latest          — most recent measurement from local SQLite
  GET /api/stats           — row counts: total / queued / sent / failed
  GET /api/queue           — up to 20 pending (unsent) rows
  GET /api/sync-status     — queue health + last successful sync info
  GET /edge/health         — alias for /health
  GET /edge/queue          — alias for /api/queue
  GET /edge/sync-status    — alias for /api/sync-status
  GET /edge/imu/latest     — IMU placeholder (stub until BNO080 is wired)
"""

import json
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

from .config import DB_PATH, STATION_NAME, VERBOSE
from .db import fetch_latest_readings, fetch_unsent, get_connection, get_queue_stats

PORT = int(os.getenv("MANGO_LOCAL_API_PORT", "9100"))


def _json(obj):
    return json.dumps(obj, default=str).encode()


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def _get_sync_status():
    stats = get_queue_stats()
    con = get_connection()
    cur = con.cursor()

    last_sent_row = cur.execute(
        "SELECT sent_at FROM measurements WHERE sent=1 ORDER BY sent_at DESC LIMIT 1"
    ).fetchone()
    last_sent_ts = last_sent_row[0] if last_sent_row else None

    last_failure_row = cur.execute(
        "SELECT last_error, measured_at FROM measurements WHERE status='failed_retry' ORDER BY id DESC LIMIT 1"
    ).fetchone()
    con.close()

    queue_ok = stats["failed_final"] == 0
    if stats["queued"] == 0:
        queue_state = "empty"
    elif stats["queued"] < 10:
        queue_state = "normal"
    elif stats["queued"] < 100:
        queue_state = "building"
    else:
        queue_state = "backlog"

    result = {
        "station": STATION_NAME,
        "server_time": _utc_now_iso(),
        "queue": {
            "state": queue_state,
            "total": stats["total"],
            "pending": stats["queued"],
            "sent": stats["sent"],
            "failed_retry": stats["failed_retry"],
            "failed_final": stats["failed_final"],
            "unsent_alerts": stats["unsent_alerts_sms"],
        },
        "last_sync": {
            "sent_at": last_sent_ts,
            "status": "ok" if last_sent_ts else "never",
        },
        "last_failure": {
            "error": last_failure_row[1] if last_failure_row else None,
            "measured_at": last_failure_row[0] if last_failure_row else None,
        } if last_failure_row else None,
        "health": "ok" if queue_ok else "degraded",
    }
    return result


def _get_queue_rows():
    rows = fetch_unsent(20)
    return [
        {
            "id": r["id"],
            "measured_at": r["measured_at"],
            "ph": r["ph"],
            "turbidity": r["turbidity"],
            "temperature": r["temperature"],
            "alert_level": r["alert_level"],
            "packet_id": r["packet_id"] if "packet_id" in r.keys() else None,
        }
        for r in rows
    ]


def _get_imu_stub():
    return {
        "station": STATION_NAME,
        "source": "BNO080",
        "status": "not_connected",
        "message": "IMU data will appear here once BNO080 is wired to the Jetson via serial.",
        "data": None,
        "timestamp": _utc_now_iso(),
    }


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        if VERBOSE:
            super(_Handler, self).log_message(fmt, *args)

    def _send(self, status, body, ct="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", ct)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]

        if path in ("/health", "/edge/health"):
            body = _json({"status": "ok", "station": STATION_NAME, "db": DB_PATH})
            self._send(200, body)

        elif path == "/api/latest":
            row = fetch_latest_readings()
            if row is None:
                self._send(200, _json({"station": STATION_NAME, "latest": None,
                                       "message": "No data yet."}))
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

        elif path == "/api/stats":
            stats = get_queue_stats()
            stats["station"] = STATION_NAME
            self._send(200, _json(stats))

        elif path in ("/api/queue", "/edge/queue"):
            rows = _get_queue_rows()
            self._send(200, _json({
                "station": STATION_NAME,
                "pending_count": len(rows),
                "rows": rows,
            }))

        elif path in ("/api/sync-status", "/edge/sync-status"):
            self._send(200, _json(_get_sync_status()))

        elif path == "/edge/imu/latest":
            self._send(200, _json(_get_imu_stub()))

        else:
            self._send(404, _json({"error": "not_found", "path": path}))


def main():
    from .db import init_db
    init_db()

    server = HTTPServer(("0.0.0.0", PORT), _Handler)
    if VERBOSE:
        print("[local_api] Listening on :{}  station={}".format(PORT, STATION_NAME), flush=True)
        print("[local_api] Endpoints: /health /api/latest /api/stats /edge/queue /edge/sync-status /edge/imu/latest")
    server.serve_forever()


if __name__ == "__main__":
    main()
