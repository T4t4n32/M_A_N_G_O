"""Synchronise unsent measurements to the backend or via LoRa.

Runs as a long-lived process that periodically checks the local SQLite
outbox and attempts to send batches to the VPS backend.
"""

import json
import os
import sys
import time
from datetime import datetime, timezone

import requests

from .config import (
    SYNC_INTERVAL, HTTP_BATCH_SIZE, VERBOSE,
    API_URL, INGEST_API_KEY, STATION_NAME,
)
from .db import init_db, fetch_unsent, mark_sent, mark_failed
from .link_state import best_transport
from .transport_http import send_batch
from .transport_lora import send_one

_MODEM_STATUS_FILE = os.getenv("MANGO_MODEM_STATUS_FILE",
                                "/opt/mango_node/modem_status.json")
_MODEM_TELEMETRY_INTERVAL = float(os.getenv("MANGO_MODEM_TELEMETRY_S", "120"))


def _telemetry_url():
    base = API_URL
    for suffix in ("/ingest/batch", "/ingest"):
        if base.endswith(suffix):
            base = base[: -len(suffix)]
            break
    return base.rstrip("/") + "/sync/telemetry"


def _read_modem_sidecar():
    try:
        with open(_MODEM_STATUS_FILE) as fh:
            return json.load(fh)
    except Exception:
        return None


def _post_modem_telemetry():
    snapshot = _read_modem_sidecar()
    if snapshot is None:
        return
    url = _telemetry_url()
    headers = {"Content-Type": "application/json"}
    if INGEST_API_KEY:
        headers["X-Api-Key"] = INGEST_API_KEY
    payload = {
        "device_id":    STATION_NAME,
        "station_name": STATION_NAME,
        "modem":        snapshot,
        "reported_at":  datetime.now(timezone.utc).isoformat(),
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=8)
        if VERBOSE and not resp.ok:
            print("[sync] modem telemetry POST {}: {}".format(resp.status_code, resp.text[:60]))
    except Exception as exc:
        if VERBOSE:
            print("[sync] modem telemetry failed: {}".format(exc))


def _send_http_batch():
    rows = fetch_unsent(HTTP_BATCH_SIZE)
    if not rows:
        return
    ok, ids, err = send_batch(rows)
    if ok:
        mark_sent(ids)
        if VERBOSE:
            print("[sync] HTTP: sent {} rows".format(len(ids)))
    else:
        mark_failed(ids, err)
        if VERBOSE:
            print("[sync] HTTP error: {}".format(err))


def _send_lora_one():
    rows = fetch_unsent(1)
    if not rows:
        return
    row = dict(rows[0])
    ok, ids, err = send_one(row)
    if ok:
        mark_sent(ids)
    else:
        mark_failed(ids, err)
    if VERBOSE:
        if ok:
            print("[sync] LoRa: sent one row")
        else:
            print("[sync] LoRa error: {}".format(err))


def main():
    init_db()
    if VERBOSE:
        print("[sync] started")
    last_modem_telemetry = 0.0
    while True:
        t = best_transport()
        if t in ("wifi", "lte", "http"):
            _send_http_batch()
            now = time.monotonic()
            if now - last_modem_telemetry >= _MODEM_TELEMETRY_INTERVAL:
                _post_modem_telemetry()
                last_modem_telemetry = time.monotonic()
        elif t == "lora":
            _send_lora_one()
        else:
            if VERBOSE:
                print("[sync] no transport available, buffering")
        time.sleep(SYNC_INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("[sync] terminated by user")
        sys.exit(0)
