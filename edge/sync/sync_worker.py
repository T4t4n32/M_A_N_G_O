#!/usr/bin/env python3
"""M.A.N.G.O. edge sync daemon.

Runs in a loop (default 30 s interval):
1. Check VPS reachability (GET /api/v1/health)
2. If reachable: upload unsynced sensor readings in batches
3. Poll pending commands from VPS (GET /api/v1/commands/pending?device_id=X)
4. Store received commands in local SQLite for the state machine to pick up
5. If mission finished and not synced: upload mission summary
6. Mark uploaded items as synced

Environment variables:
  VPS_URL          — e.g. https://mango.calibots.com
  INGEST_API_KEY   — shared secret for ingest/command endpoints
  DEVICE_ID        — e.g. mango-field-unit-01
  DB_PATH          — path to edge.db (default /opt/mango/edge.db)
  SYNC_INTERVAL    — seconds between cycles (default 30)
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

# Ensure the edge app package is importable when run directly
_EDGE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _EDGE_ROOT not in sys.path:
    sys.path.insert(0, _EDGE_ROOT)

from app.db import (
    get_unsynced_sensor_readings,
    get_unsynced_missions,
    list_pending_commands,
    mark_command_done,
    mark_mission_synced,
    mark_sensor_readings_synced,
    store_command,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [sync] %(levelname)s %(message)s",
)
log = logging.getLogger("mango.edge.sync")

# ─── Config ──────────────────────────────────────────────────────────────────

VPS_URL = os.environ.get("VPS_URL", "").rstrip("/")
INGEST_API_KEY = os.environ.get("INGEST_API_KEY", "")
DEVICE_ID = os.environ.get("DEVICE_ID", "mango-field-unit-01")
DB_PATH = os.environ.get("DB_PATH", "/opt/mango/edge.db")
SYNC_INTERVAL = int(os.environ.get("SYNC_INTERVAL", "30"))

BATCH_SIZE = 100  # sensor readings per HTTP request


# ─── HTTP helpers ─────────────────────────────────────────────────────────────

def _headers() -> dict:
    h = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if INGEST_API_KEY:
        h["X-Api-Key"] = INGEST_API_KEY
    return h


def _get(path: str, timeout: int = 5) -> dict | None:
    if not VPS_URL:
        return None
    url = f"{VPS_URL}{path}"
    try:
        req = urllib.request.Request(url, headers=_headers())
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        log.warning("GET %s → HTTP %d", path, exc.code)
        return None
    except Exception as exc:
        log.debug("GET %s failed: %s", path, exc)
        return None


def _post(path: str, body: dict, timeout: int = 15) -> dict | None:
    if not VPS_URL:
        return None
    url = f"{VPS_URL}{path}"
    data = json.dumps(body).encode()
    try:
        req = urllib.request.Request(url, data=data, headers=_headers(), method="POST")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        log.warning("POST %s → HTTP %d", path, exc.code)
        return None
    except Exception as exc:
        log.debug("POST %s failed: %s", path, exc)
        return None


# ─── Sync steps ───────────────────────────────────────────────────────────────

def check_vps_reachable() -> bool:
    result = _get("/api/v1/health", timeout=5)
    return result is not None


def upload_sensor_readings() -> int:
    """Upload unsynced sensor readings in batches. Returns total uploaded."""
    total = 0
    while True:
        rows = get_unsynced_sensor_readings(DB_PATH, limit=BATCH_SIZE)
        if not rows:
            break

        # Convert to ingest batch format (new Sensors_V2 packet per row)
        packets = []
        for r in rows:
            readings: dict = {r["type"]: r["value"]}
            pkt = {
                "type": "sensor_reading",
                "mission_id": r.get("mission_id"),
                "station": r.get("station") or DEVICE_ID,
                "source": r.get("source") or "edge-sync",
                "readings": readings,
                "device_id": DEVICE_ID,
            }
            if r.get("ts_device"):
                pkt["timestamp_device"] = r["ts_device"]
            packets.append(pkt)

        result = _post("/api/v1/ingest/batch", {"packets": packets})
        if result is None:
            log.warning("ingest/batch failed — will retry next cycle")
            break

        ids = [r["id"] for r in rows]
        mark_sensor_readings_synced(DB_PATH, ids)
        total += len(ids)
        log.info("Uploaded %d sensor readings", len(ids))

        if len(rows) < BATCH_SIZE:
            break  # no more rows

    return total


def poll_commands() -> int:
    """Poll VPS for pending commands. Returns count of new commands stored."""
    result = _get(f"/api/v1/commands/pending?device_id={DEVICE_ID}")
    if not result:
        return 0

    commands = result.get("commands") or []
    count = 0
    for cmd in commands:
        remote_id = cmd.get("id")
        if remote_id is None:
            continue
        store_command(
            DB_PATH,
            remote_id=remote_id,
            device_id=cmd.get("device_id"),
            mission_id=cmd.get("mission_id"),
            command=cmd.get("command", ""),
            params=cmd.get("params"),
        )
        count += 1
        # Acknowledge delivery
        _post(f"/api/v1/commands/{remote_id}/ack",
              {"status": "acknowledged", "device_id": DEVICE_ID})

    if count:
        log.info("Received %d command(s) from VPS", count)
    return count


def upload_finished_missions() -> int:
    """Upload summary for missions that finished locally but not yet synced."""
    missions = get_unsynced_missions(DB_PATH)
    count = 0
    for m in missions:
        result = _post("/api/v1/missions", {
            "mission_id": m["mission_id"],
            "device_id": m.get("device_id") or DEVICE_ID,
            "state": "MISSION_FINISHED",
            "summary": m.get("summary"),
            "notes": m.get("notes"),
            "source": "edge-sync",
        })
        if result and result.get("ok"):
            mark_mission_synced(DB_PATH, m["mission_id"])
            count += 1
            log.info("Synced mission %s to VPS", m["mission_id"])
        else:
            log.warning("Failed to sync mission %s", m["mission_id"])
    return count


# ─── Main loop ────────────────────────────────────────────────────────────────

def run_cycle() -> None:
    if not VPS_URL:
        log.warning("VPS_URL not set — skipping sync cycle")
        return

    if not check_vps_reachable():
        log.info("VPS not reachable — skipping cycle")
        return

    log.debug("VPS reachable, running sync cycle")
    upload_sensor_readings()
    poll_commands()
    upload_finished_missions()


def main() -> None:
    log.info(
        "Sync worker starting — device=%s vps=%s interval=%ds",
        DEVICE_ID, VPS_URL or "(not set)", SYNC_INTERVAL,
    )

    while True:
        try:
            run_cycle()
        except Exception as exc:
            log.exception("Unhandled error in sync cycle: %s", exc)
        time.sleep(SYNC_INTERVAL)


if __name__ == "__main__":
    main()
