#!/usr/bin/env python3
# backend/lora_http_bridge.py

import os
import json
import time
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    import serial  # pyserial
except Exception as e:
    raise SystemExit("Missing dependency: pyserial. Add it to requirements.txt") from e


# ----------------------------
# Config (env)
# ----------------------------
SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
BAUDRATE = int(os.getenv("BAUDRATE", "9600"))
READ_TIMEOUT_S = float(os.getenv("READ_TIMEOUT_S", "1.0"))

API_URL = os.getenv("API_URL", "http://localhost:8000/api/v1/ingest")
HTTP_TIMEOUT_S = float(os.getenv("HTTP_TIMEOUT_S", "5.0"))

STATION_NAME = os.getenv("STATION_NAME", "MANGO Station")
STATION_LOCATION = os.getenv("STATION_LOCATION", "")
STATION_LAT = os.getenv("STATION_LAT", "")
STATION_LON = os.getenv("STATION_LON", "")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
DRY_RUN = os.getenv("DRY_RUN", "0") == "1"

# Si tu TX manda muchas líneas por segundo, esto te protege del spam.
MIN_SECONDS_BETWEEN_POSTS = float(os.getenv("MIN_SECONDS_BETWEEN_POSTS", "0.0"))


# ----------------------------
# Logging
# ----------------------------
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)s | bridge | %(message)s",
)
log = logging.getLogger("bridge")


# ----------------------------
# Helpers
# ----------------------------
def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_http_session() -> requests.Session:
    sess = requests.Session()
    retry = Retry(
        total=8,
        backoff_factor=0.4,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["POST"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=10)
    sess.mount("http://", adapter)
    sess.mount("https://", adapter)
    return sess


def normalize_key(key: str) -> str:
    k = key.strip().lower()

    # alias comunes
    aliases = {
        "temp": "temperature",
        "temperature_c": "temperature",
        "t": "temperature",
        "ph_value": "ph",
        "ntu": "turbidity",
        "turb": "turbidity",
        "turbidity_ntu": "turbidity",
    }
    return aliases.get(k, k)


def try_parse_float(x: Any) -> Optional[float]:
    try:
        return float(str(x).strip())
    except Exception:
        return None


def parse_json_line(line: str) -> Optional[Dict[str, Any]]:
    try:
        obj = json.loads(line)
        if isinstance(obj, dict):
            return obj
    except Exception:
        return None
    return None


def parse_kv_line(line: str) -> Dict[str, Any]:
    """
    Soporta:
      ph=7.1,temp=24.6,turb=12.2
      ph:7.1; temperature:24.6; turbidity:12.2
    """
    # separadores de pares
    parts = re.split(r"[;,]\s*", line.strip())
    out: Dict[str, Any] = {}

    for p in parts:
        if not p:
            continue
        if "=" in p:
            k, v = p.split("=", 1)
        elif ":" in p:
            k, v = p.split(":", 1)
        else:
            continue

        k = normalize_key(k)
        val = try_parse_float(v)
        if val is None:
            continue
        out[k] = val

    return out


def readings_from_obj(obj: Dict[str, Any]) -> List[Dict[str, Any]]:
    readings: List[Dict[str, Any]] = []

    for raw_k, raw_v in obj.items():
        k = normalize_key(raw_k)
        if k in ("station", "station_name", "name", "location", "lat", "lon", "ts", "time"):
            continue

        val = try_parse_float(raw_v)
        if val is None:
            continue

        if k in ("ph", "temperature", "turbidity"):
            readings.append({"type": k, "value": val})
        # Si te llega algo extra, lo ignoramos por ahora (no rompemos).
    return readings


def build_payload(line: str) -> Optional[Dict[str, Any]]:
    """
    Devuelve payload listo para /api/v1/ingest:
    {
      "station": {"name": "...", "location": "...", "lat": ..., "lon": ...},
      "readings": [{"type":"ph","value":7.1}, ...]
    }
    """
    line = line.strip()
    if not line:
        return None

    obj = parse_json_line(line)
    if obj is None:
        obj = parse_kv_line(line)

    if not isinstance(obj, dict) or not obj:
        return None

    # station override si viene en JSON
    station_name = obj.get("station_name") or obj.get("station") or STATION_NAME
    station: Dict[str, Any] = {"name": str(station_name)}

    if STATION_LOCATION:
        station["location"] = STATION_LOCATION

    # lat/lon opcionales
    lat = try_parse_float(obj.get("lat") or STATION_LAT)
    lon = try_parse_float(obj.get("lon") or STATION_LON)
    if lat is not None:
        station["lat"] = lat
    if lon is not None:
        station["lon"] = lon

    readings = readings_from_obj(obj)
    if not readings:
        return None

    return {"station": station, "readings": readings}


def main() -> int:
    log.info("Starting bridge")
    log.info("SERIAL_PORT=%s BAUDRATE=%s API_URL=%s DRY_RUN=%s", SERIAL_PORT, BAUDRATE, API_URL, DRY_RUN)

    sess = make_http_session()

    try:
        ser = serial.Serial(
            port=SERIAL_PORT,
            baudrate=BAUDRATE,
            timeout=READ_TIMEOUT_S,
        )
    except Exception as e:
        log.error("Cannot open serial port %s: %s", SERIAL_PORT, e)
        return 2

    last_post_ts = 0.0

    while True:
        try:
            raw = ser.readline()  # bytes (con timeout)
            if not raw:
                continue

            try:
                line = raw.decode("utf-8", errors="replace").strip()
            except Exception:
                line = str(raw)

            payload = build_payload(line)
            if payload is None:
                log.warning("Unparsed/ignored line: %r", line[:200])
                continue

            # throttle opcional
            if MIN_SECONDS_BETWEEN_POSTS > 0:
                now = time.time()
                if (now - last_post_ts) < MIN_SECONDS_BETWEEN_POSTS:
                    continue

            if DRY_RUN:
                log.info("DRY_RUN payload=%s", payload)
                continue

            r = sess.post(API_URL, json=payload, timeout=HTTP_TIMEOUT_S)
            if r.ok:
                last_post_ts = time.time()
                log.info("POST %s -> %s | resp=%s", API_URL, r.status_code, r.text.strip())
            else:
                log.error("POST failed %s -> %s | resp=%s", API_URL, r.status_code, r.text.strip())

        except KeyboardInterrupt:
            log.info("Bridge stopped by user")
            return 0
        except Exception as e:
            log.exception("Runtime error: %s", e)
            time.sleep(1.0)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
