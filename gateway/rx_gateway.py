#!/usr/bin/env python3
"""M.A.N.G.O. RX Gateway (Laptop) — v3 (adds clear logging)

Why you didn't see anything in the gateway terminal:
- v2 was intentionally quiet (only startup + local API + occasional flush logs).
- It still RECEIVED data (your backend + local API showed metrics and series).

v3 adds OPTIONAL logging so you can SEE what's coming from serial:
- LOG_RAW=1        prints every raw serial line (noisy)
- LOG_EVERY_N=10   prints one parsed packet every N packets (default 25)
- LOG_SEND=1       prints send/queue result (default 1)
- DROP_NEG1=1      drops readings with value == -1 (default 0)

Supported RX prefixes:
- MANGO_META:{...}
- MANGO_JSON:{...}
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
from datetime import datetime, timezone, timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Optional
from urllib.parse import urlparse, parse_qs

import requests
import serial  # pyserial


SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
BAUDRATE = int(os.getenv("BAUDRATE", "115200"))
READ_TIMEOUT_S = float(os.getenv("READ_TIMEOUT_S", "1.0"))

API_URL = os.getenv("API_URL", "http://localhost:8000/api/v1/ingest")
HTTP_TIMEOUT_S = float(os.getenv("HTTP_TIMEOUT_S", "6.0"))

DB_PATH = os.getenv("SPOOL_DB", "./mango_gateway.db")
STATION_NAME = os.getenv("STATION_NAME", "MANGO Station")

FLUSH_INTERVAL_S = float(os.getenv("FLUSH_INTERVAL_S", "5"))
FLUSH_BATCH = int(os.getenv("FLUSH_BATCH", "50"))

LOCAL_API_PORT = int(os.getenv("LOCAL_API_PORT", "9100"))
ENABLE_LOCAL_API = os.getenv("ENABLE_LOCAL_API", "1") in ("1", "true", "True", "yes", "YES")

SEND_DEBUG = os.getenv("SEND_DEBUG", "0") in ("1", "true", "True", "yes", "YES")
INGEST_API_KEY = os.getenv("INGEST_API_KEY", "").strip()

LOG_RAW = os.getenv("LOG_RAW", "0") in ("1", "true", "True", "yes", "YES")
LOG_SEND = os.getenv("LOG_SEND", "1") in ("1", "true", "True", "yes", "YES")
LOG_EVERY_N = int(os.getenv("LOG_EVERY_N", "25"))
DROP_NEG1 = os.getenv("DROP_NEG1", "0") in ("1", "true", "True", "yes", "YES")


def _db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, check_same_thread=False)
    con.execute("PRAGMA journal_mode=WAL;")
    con.execute("PRAGMA synchronous=NORMAL;")
    return con


def db_init() -> None:
    con = _db()
    cur = con.cursor()
    cur.execute(
        """
      CREATE TABLE IF NOT EXISTS inbox(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        received_at INTEGER NOT NULL,
        ingest_json TEXT NOT NULL
      )
    """
    )
    cur.execute(
        """
      CREATE TABLE IF NOT EXISTS outbox(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        ingest_json TEXT NOT NULL,
        sent_at INTEGER
      )
    """
    )
    con.commit()
    con.close()


def inbox_insert(ingest_payload: dict[str, Any]) -> None:
    con = _db()
    con.execute(
        "INSERT INTO inbox(received_at, ingest_json) VALUES(?, ?)",
        (int(time.time()), json.dumps(ingest_payload, separators=(",", ":"), ensure_ascii=False)),
    )
    con.commit()
    con.close()


def outbox_enqueue(ingest_payload: dict[str, Any], error: str) -> None:
    con = _db()
    con.execute(
        "INSERT INTO outbox(created_at, attempts, last_error, ingest_json, sent_at) VALUES(?, 0, ?, ?, NULL)",
        (int(time.time()), error[:500], json.dumps(ingest_payload, separators=(",", ":"), ensure_ascii=False)),
    )
    con.commit()
    con.close()


def outbox_fetch(limit: int) -> list[sqlite3.Row]:
    con = _db()
    con.row_factory = sqlite3.Row
    rows = con.execute(
        "SELECT id, attempts, ingest_json FROM outbox WHERE sent_at IS NULL ORDER BY id ASC LIMIT ?",
        (limit,),
    ).fetchall()
    con.close()
    return rows


def outbox_mark_sent(row_id: int) -> None:
    con = _db()
    con.execute("UPDATE outbox SET sent_at=? WHERE id=?", (int(time.time()), row_id))
    con.commit()
    con.close()


def outbox_mark_fail(row_id: int, error: str) -> None:
    con = _db()
    con.execute(
        "UPDATE outbox SET attempts=attempts+1, last_error=? WHERE id=?",
        (error[:500], row_id),
    )
    con.commit()
    con.close()


def _iso_utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_ingest(meta: Optional[dict[str, Any]], data: dict[str, Any]) -> dict[str, Any]:
    readings: list[dict[str, Any]] = []

    def add(name: str, value: Any, unit: Optional[str] = None):
        if value is None:
            return
        try:
            v = float(value)
        except (TypeError, ValueError):
            print(f"[gateway] dropping non-numeric reading {name}={value!r}")
            return
        if DROP_NEG1 and v == -1.0:
            return
        readings.append({"type": name, "value": v, "unit": unit})

    add("temp", data.get("t"), "C")
    add("ph", data.get("ph"), "pH")
    add("turbidity", data.get("tu"), "NTU")

    if SEND_DEBUG:
        add("temp_status", data.get("ts"))
        add("temp_raw", data.get("tr"))
        add("ph_status", data.get("phs"))
        add("ph_voltage", data.get("phv"), "V")
        add("ph_raw", data.get("phr"))
        add("turbidity_status", data.get("tus"))
        add("turbidity_voltage", data.get("tuv"), "V")
        add("turbidity_raw", data.get("tur"))
        add("turbidity_nu", data.get("tunu"))
        add("turbidity_do", data.get("tudo"))
        if isinstance(meta, dict):
            add("rssi", meta.get("rssi"), "dBm")
            add("snr", meta.get("snr"), "dB")
            add("freqerr", meta.get("freqerr"), "Hz")

    packet_id = f"rxgw-{int(time.time()*1000)}"

    payload: dict[str, Any] = {
        "station": {"name": STATION_NAME},
        "packet_id": packet_id,
        "ts": _iso_utc_now(),
        "readings": readings,
    }
    if meta is not None:
        payload["meta"] = meta
    payload["raw"] = data
    return payload


def post_ingest(ingest_payload: dict[str, Any]) -> None:
    headers = {"Content-Type": "application/json"}
    if INGEST_API_KEY:
        headers["X-API-Key"] = INGEST_API_KEY
    r = requests.post(API_URL, json=ingest_payload, headers=headers, timeout=HTTP_TIMEOUT_S)
    r.raise_for_status()


def flush_outbox_once(batch: int = FLUSH_BATCH) -> tuple[int, int]:
    sent = 0
    failed = 0
    for row in outbox_fetch(batch):
        row_id = int(row["id"])
        try:
            ingest_payload = json.loads(row["ingest_json"])
            post_ingest(ingest_payload)
            outbox_mark_sent(row_id)
            sent += 1
        except Exception as e:
            outbox_mark_fail(row_id, str(e))
            failed += 1
    return sent, failed


def parse_meta_line(line: str) -> Optional[dict[str, Any]]:
    line = line.strip()
    if not line.startswith("MANGO_META:"):
        return None
    raw = line[len("MANGO_META:"):].strip()
    try:
        return json.loads(raw)
    except ValueError as e:
        print(f"[gateway] malformed MANGO_META line dropped ({e}): {raw[:200]!r}")
        return None


def parse_data_line(line: str) -> Optional[dict[str, Any]]:
    line = line.strip()
    if not line.startswith("MANGO_JSON:"):
        return None
    raw = line[len("MANGO_JSON:"):].strip()
    try:
        return json.loads(raw)
    except ValueError as e:
        print(f"[gateway] malformed MANGO_JSON line dropped ({e}): {raw[:200]!r}")
        return None


def _get_latest_by_type_from_db() -> dict[str, Any]:
    con = _db()
    con.row_factory = sqlite3.Row
    rows = con.execute("SELECT ingest_json FROM inbox ORDER BY id DESC LIMIT 800").fetchall()
    con.close()

    latest: dict[str, dict[str, Any]] = {}
    for row in rows:
        try:
            ingest = json.loads(row["ingest_json"])
            ts = ingest.get("ts")
            for r in ingest.get("readings") or []:
                t = str(r.get("type") or "").strip()
                if not t or t in latest:
                    continue
                latest[t] = {"type": t, "value": r.get("value"), "unit": r.get("unit"), "ts": ts}
        except ValueError as e:
            print(f"[gateway] skipping corrupt inbox row in /latest ({e})")
            continue
    return {"latest": latest}


def _get_metrics_from_db() -> dict[str, Any]:
    con = _db()
    con.row_factory = sqlite3.Row
    rows = con.execute("SELECT ingest_json FROM inbox ORDER BY id DESC LIMIT 1200").fetchall()
    con.close()

    metrics = set()
    for row in rows:
        try:
            ingest = json.loads(row["ingest_json"])
            for r in ingest.get("readings") or []:
                t = str(r.get("type") or "").strip()
                if t:
                    metrics.add(t)
        except ValueError as e:
            print(f"[gateway] skipping corrupt inbox row in /metrics ({e})")
            continue
    return {"metrics": sorted(metrics)}


def _get_range_from_db(metric: str, minutes: int, limit: int = 5000) -> dict[str, Any]:
    metric = metric.strip()
    minutes = max(1, min(minutes, 60 * 24 * 14))
    limit = max(10, min(limit, 5000))

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)

    con = _db()
    con.row_factory = sqlite3.Row
    rows = con.execute("SELECT received_at, ingest_json FROM inbox ORDER BY id DESC LIMIT 8000").fetchall()
    con.close()

    series = []
    for row in reversed(rows):
        recv_ts = datetime.fromtimestamp(int(row["received_at"]), tz=timezone.utc)
        if recv_ts < cutoff:
            continue
        try:
            ingest = json.loads(row["ingest_json"])
            for r in ingest.get("readings") or []:
                if str(r.get("type")) == metric:
                    series.append({"ts": recv_ts.isoformat(), "value": r.get("value"), "unit": r.get("unit")})
                    break
        except ValueError as e:
            print(f"[gateway] skipping corrupt inbox row in /range ({e})")
            continue
        if len(series) >= limit:
            break

    return {"type": metric, "minutes": minutes, "count": len(series), "series": series}


class LocalAPIHandler(BaseHTTPRequestHandler):
    def _send_json(self, obj: Any, status: int = 200):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path == "/health":
            return self._send_json({"status": "ok", "time": _iso_utc_now()})

        if path == "/api/v1/metrics":
            return self._send_json(_get_metrics_from_db())

        if path == "/api/v1/latest/by_type":
            return self._send_json(_get_latest_by_type_from_db())

        if path == "/api/v1/range":
            metric = (qs.get("type") or [""])[0]
            minutes = int((qs.get("minutes") or ["60"])[0])
            limit = int((qs.get("limit") or ["2000"])[0])
            if not metric:
                return self._send_json({"error": "missing type"}, 400)
            return self._send_json(_get_range_from_db(metric, minutes, limit))

        return self._send_json({"error": "not found"}, 404)

    def log_message(self, fmt, *args):
        return


def start_local_api():
    httpd = HTTPServer(("0.0.0.0", LOCAL_API_PORT), LocalAPIHandler)
    print(f"[gateway] Local API on :{LOCAL_API_PORT}")
    httpd.serve_forever()


def main():
    db_init()

    print(f"[gateway] Serial: {SERIAL_PORT} @ {BAUDRATE}")
    print(f"[gateway] Backend API_URL: {API_URL}")
    print(f"[gateway] Spool DB: {DB_PATH}")
    print(f"[gateway] SEND_DEBUG={int(SEND_DEBUG)} DROP_NEG1={int(DROP_NEG1)}")
    print(f"[gateway] LOG_RAW={int(LOG_RAW)} LOG_EVERY_N={LOG_EVERY_N} LOG_SEND={int(LOG_SEND)}")

    if ENABLE_LOCAL_API:
        threading.Thread(target=start_local_api, daemon=True).start()

    def flush_loop():
        while True:
            try:
                sent, failed = flush_outbox_once()
                if sent or failed:
                    print(f"[gateway] flush sent={sent} failed={failed}")
            except Exception as e:
                print(f"[gateway] flush error: {e}")
            time.sleep(FLUSH_INTERVAL_S)

    threading.Thread(target=flush_loop, daemon=True).start()

    last_meta: Optional[dict[str, Any]] = None
    last_meta_at = 0.0
    pkt_count = 0
    sent_count = 0
    queued_count = 0

    while True:
        try:
            with serial.Serial(SERIAL_PORT, BAUDRATE, timeout=READ_TIMEOUT_S) as ser:
                print("[gateway] Serial opened.")
                while True:
                    raw = ser.readline()
                    if not raw:
                        continue  # timeout
                    line = raw.decode(errors="ignore").strip()
                    if not line:
                        continue

                    if LOG_RAW:
                        print(f"[rx] {line}")

                    meta = parse_meta_line(line)
                    if meta is not None:
                        last_meta = meta
                        last_meta_at = time.time()
                        continue

                    data = parse_data_line(line)
                    if data is None:
                        continue

                    meta_to_use = last_meta if (time.time() - last_meta_at) <= 3.0 else None
                    ingest_payload = build_ingest(meta_to_use, data)

                    pkt_count += 1
                    if pkt_count % max(1, LOG_EVERY_N) == 0:
                        print(f"[gateway] RX pkt#{pkt_count} t={data.get('t')} ph={data.get('ph')} tu={data.get('tu')}")

                    inbox_insert(ingest_payload)

                    try:
                        post_ingest(ingest_payload)
                        sent_count += 1
                        if LOG_SEND:
                            print(f"[gateway] sent pkt#{pkt_count} (sent={sent_count} queued={queued_count})")
                    except Exception as e:
                        queued_count += 1
                        outbox_enqueue(ingest_payload, str(e))
                        if LOG_SEND:
                            print(f"[gateway] queued pkt#{pkt_count} err={e} (sent={sent_count} queued={queued_count})")

        except Exception as e:
            print(f"[gateway] Serial error: {e}")
            time.sleep(2)


if __name__ == "__main__":
    main()
