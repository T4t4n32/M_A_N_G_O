"""M.A.N.G.O. LoRa/Serial -> HTTP bridge (with --dummy mode).

GOALS
- Default mode (no flags): read from SERIAL_PORT and POST to API_URL.
- Dummy mode (--dummy): no hardware needed, generates synthetic readings.
- Robust: never crash on missing serial device, transient network errors,
  malformed lines, or missing optional dependencies.

ENV VARS (all optional)
- API_URL            (default: http://backend:5000/api/v1/ingest)
- STATION_NAME       (default: MANGO Station)
- SERIAL_PORT        (default: /dev/ttyMANGO)
- BAUDRATE           (default: 9600)
- READ_TIMEOUT_S     (default: 1.0)
- HTTP_TIMEOUT_S     (default: 5.0)
- DUMMY_INTERVAL_S   (default: 5)
- LOG_LEVEL          (default: INFO)

PAYLOAD FORMAT (sent to backend)
{
  "station": {"name": "MANGO Station"},
  "readings": [
    {"type": "temp", "value": 25.7, "unit": "C"},
    {"type": "turbidity", "value": 12.3, "unit": "NTU"}
  ]
}

This file is additive: it supports hardware AND no-hardware flows.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _env(key: str, default: str) -> str:
    v = os.getenv(key)
    return v if v not in (None, "") else default


def _env_float(key: str, default: float) -> float:
    v = os.getenv(key)
    try:
        return float(v) if v not in (None, "") else default
    except (TypeError, ValueError):
        logging.warning("%s=%r is not a number — using %s", key, v, default)
        return default


def _env_int(key: str, default: int) -> int:
    v = os.getenv(key)
    try:
        return int(v) if v not in (None, "") else default
    except (TypeError, ValueError):
        logging.warning("%s=%r is not an integer — using %s", key, v, default)
        return default


def setup_logging() -> None:
    level = _env("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, level, logging.INFO),
        format="[bridge] %(asctime)s %(levelname)s - %(message)s",
    )


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_payload(
    station_name: str,
    readings: List[Dict[str, Any]],
) -> Dict[str, Any]:
    # Ensure required keys and types.
    cleaned: List[Dict[str, Any]] = []
    for r in readings:
        if not isinstance(r, dict):
            continue
        r_type = str(r.get("type", "")).strip()
        if not r_type:
            continue
        try:
            value = float(r.get("value"))
        except (TypeError, ValueError):
            logging.warning("Dropping reading %s: non-numeric value %r", r_type, r.get("value"))
            continue
        unit = r.get("unit")
        unit = str(unit).strip() if unit not in (None, "") else None
        cleaned.append({"type": r_type, "value": value, "unit": unit})

    return {
        "station": {"name": station_name},
        "readings": cleaned,
        "ts": now_iso(),
        "source": "bridge",
    }


def http_post_json(url: str, payload: Dict[str, Any], timeout_s: float) -> bool:
    try:
        import requests  # type: ignore
    except Exception as e:
        logging.error("Missing dependency 'requests': %s", e)
        return False

    try:
        r = requests.post(url, json=payload, timeout=timeout_s)
        if 200 <= r.status_code < 300:
            return True
        logging.warning("HTTP %s: %s", r.status_code, (r.text or "").strip()[:300])
        return False
    except Exception as e:
        logging.warning("HTTP error: %s", e)
        return False


def parse_line(line: str) -> Optional[Dict[str, Any]]:
    """Try to parse a serial line into a dict.

    Supported:
    - JSON object (either full payload or readings dict)
    - key=value CSV (temp=25.7,turbidity=12.3)
    - value CSV (25.7,12.3) interpreted as temp,turbidity
    """
    s = line.strip()
    if not s:
        return None

    # JSON
    if s.startswith("{") and s.endswith("}"):
        try:
            obj = json.loads(s)
        except ValueError as exc:
            logging.warning("Malformed JSON line (%s): %r", exc, s[:200])
        else:
            if isinstance(obj, dict):
                return obj
            logging.warning("JSON line is not an object — skipped: %r", s[:200])

    # key=value pairs
    if "=" in s:
        parts = [p.strip() for p in s.split(",") if p.strip()]
        d: Dict[str, Any] = {}
        for p in parts:
            if "=" not in p:
                continue
            k, v = p.split("=", 1)
            d[k.strip()] = v.strip()
        return d if d else None

    # raw CSV values
    if "," in s:
        parts = [p.strip() for p in s.split(",") if p.strip()]
        if len(parts) >= 2:
            return {"temp": parts[0], "turbidity": parts[1]}

    return None


def obj_to_readings(obj: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert various dict shapes into readings[] list."""
    # If already looks like full payload
    if "readings" in obj and isinstance(obj.get("readings"), list):
        out: List[Dict[str, Any]] = []
        for r in obj["readings"]:
            if isinstance(r, dict) and "type" in r and "value" in r:
                out.append(r)
        return out

    # Else treat keys as metric names
    readings: List[Dict[str, Any]] = []
    for k, v in obj.items():
        if k in ("station", "ts", "source"):
            continue
        # accept nested {value,unit}
        if isinstance(v, dict) and "value" in v:
            readings.append({"type": k, "value": v.get("value"), "unit": v.get("unit")})
        else:
            readings.append({"type": k, "value": v, "unit": None})
    return readings


def serial_loop(
    api_url: str,
    station_name: str,
    serial_port: str,
    baudrate: int,
    read_timeout_s: float,
    http_timeout_s: float,
    once: bool,
    dry_run: bool,
) -> None:
    try:
        import serial  # type: ignore
    except Exception as e:
        logging.error("Missing dependency 'pyserial': %s", e)
        return

    backoff = 1.0
    while True:
        try:
            logging.info("Opening serial %s @ %s...", serial_port, baudrate)
            with serial.Serial(serial_port, baudrate=baudrate, timeout=read_timeout_s) as ser:
                backoff = 1.0
                while True:
                    raw = ser.readline()
                    if not raw:
                        if once:
                            return
                        continue
                    try:
                        line = raw.decode("utf-8", errors="ignore").strip()
                    except Exception:
                        logging.warning("Undecodable serial frame — using repr", exc_info=True)
                        line = str(raw)

                    obj = parse_line(line)
                    if not obj:
                        logging.debug("Skip line: %r", line[:200])
                        if once:
                            return
                        continue

                    readings = obj_to_readings(obj)
                    payload = normalize_payload(station_name, readings)

                    if not payload["readings"]:
                        logging.debug("No valid readings in line: %r", line[:200])
                        if once:
                            return
                        continue

                    if dry_run:
                        logging.info("DRY-RUN payload: %s", json.dumps(payload)[:500])
                        ok = True
                    else:
                        ok = http_post_json(api_url, payload, http_timeout_s)

                    logging.info("POST %s -> %s (readings=%d)", api_url, "OK" if ok else "FAIL", len(payload["readings"]))

                    if once:
                        return

        except Exception as e:
            logging.warning("Serial loop error: %s", e)
            logging.info("Retrying in %.1fs...", backoff)
            time.sleep(backoff)
            backoff = min(backoff * 1.7, 15.0)


def dummy_loop(
    api_url: str,
    station_name: str,
    http_timeout_s: float,
    interval_s: int,
    dry_run: bool,
) -> None:
    # A simple random-walk model to look "real" but still synthetic.
    temp = 25.0
    turb = 10.0
    sal = 32.0

    logging.info("Dummy mode ON: sending synthetic readings every %ss", interval_s)

    while True:
        temp += random.uniform(-0.2, 0.2)
        turb += random.uniform(-0.6, 0.6)
        sal += random.uniform(-0.05, 0.05)

        readings = [
            {"type": "temp", "value": round(temp, 2), "unit": "C"},
            {"type": "turbidity", "value": round(max(turb, 0.0), 2), "unit": "NTU"},
            {"type": "salinity", "value": round(max(sal, 0.0), 2), "unit": "PSU"},
        ]
        payload = normalize_payload(station_name, readings)

        if dry_run:
            logging.info("DRY-RUN payload: %s", json.dumps(payload)[:500])
            ok = True
        else:
            ok = http_post_json(api_url, payload, http_timeout_s)

        logging.info("POST %s -> %s", api_url, "OK" if ok else "FAIL")
        time.sleep(max(1, interval_s))


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(add_help=True)
    p.add_argument("--dummy", action="store_true", help="Run without hardware, send synthetic readings")
    p.add_argument("--once", action="store_true", help="Serial mode only: exit after one read attempt")
    p.add_argument("--dry-run", action="store_true", help="Do not send HTTP, only print/log payload")
    return p


def main() -> int:
    setup_logging()

    args = build_arg_parser().parse_args()

    api_url = _env("API_URL", "http://backend:5000/api/v1/ingest")
    station_name = _env("STATION_NAME", "MANGO Station")
    http_timeout_s = _env_float("HTTP_TIMEOUT_S", 5.0)

    if args.dummy:
        interval_s = _env_int("DUMMY_INTERVAL_S", 5)
        dummy_loop(api_url, station_name, http_timeout_s, interval_s, args.dry_run)
        return 0

    serial_port = _env("SERIAL_PORT", "/dev/ttyMANGO")
    baudrate = _env_int("BAUDRATE", 9600)
    read_timeout_s = _env_float("READ_TIMEOUT_S", 1.0)

    serial_loop(
        api_url=api_url,
        station_name=station_name,
        serial_port=serial_port,
        baudrate=baudrate,
        read_timeout_s=read_timeout_s,
        http_timeout_s=http_timeout_s,
        once=args.once,
        dry_run=args.dry_run,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
