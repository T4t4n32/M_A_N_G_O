import json
import os
import re
import sys
import time
from typing import Any, Dict, Optional

import requests
import serial


SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
BAUD = int(os.getenv("BAUD", "115200"))
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")

INGEST_URL = f"{API_BASE_URL}/api/data/ingest"

# Fallback endpoints (compat)
TEMP_URL = f"{API_BASE_URL}/api/sensors/temperature/data"
PH_URL = f"{API_BASE_URL}/api/sensors/ph/data"
TURB_URL = f"{API_BASE_URL}/api/sensors/turbidity/data"

JSON_RE = re.compile(r"(\{.*\})")
META_RE = re.compile(r"RSSI:(?P<rssi>-?\d+(\.\d+)?)\s+SNR:(?P<snr>-?\d+(\.\d+)?)\s+FREQERR:(?P<freqerr>-?\d+(\.\d+)?)")


def log(msg: str) -> None:
    print(msg, flush=True)


def extract_json(line: str) -> Optional[Dict[str, Any]]:
    m = JSON_RE.search(line)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


def extract_meta(line: str) -> Optional[Dict[str, Any]]:
    m = META_RE.search(line)
    if not m:
        return None
    return {
        "rssi": float(m.group("rssi")),
        "snr": float(m.group("snr")),
        "freqerr": float(m.group("freqerr")),
    }


def post_json(url: str, payload: Dict[str, Any], timeout: float = 3.0) -> bool:
    try:
        r = requests.post(url, json=payload, timeout=timeout)
        if 200 <= r.status_code < 300:
            return True
        log(f"[BRIDGE] POST {url} -> {r.status_code} {r.text[:160]}")
        return False
    except Exception as e:
        log(f"[BRIDGE] POST {url} failed: {e}")
        return False


def fallback_per_sensor(reading: Dict[str, Any], meta: Dict[str, Any]) -> None:
    if "t" in reading or "ts" in reading:
        post_json(TEMP_URL, {
            "value": reading.get("t", -1),
            "status": reading.get("ts", 1),
            "raw": reading.get("tr"),
            "meta": meta,
        })

    if "ph" in reading or "phs" in reading:
        post_json(PH_URL, {
            "value": reading.get("ph", -1),
            "status": reading.get("phs", 1),
            "raw": reading.get("phr"),
            "voltage": reading.get("phv"),
            "meta": meta,
        })

    if "tu" in reading or "tus" in reading or "tunu" in reading:
        post_json(TURB_URL, {
            "value": reading.get("tunu", reading.get("tu", -1)),
            "status": reading.get("tus", 1),
            "raw": reading.get("tur"),
            "voltage": reading.get("tuv"),
            "meta": {**meta, "turb_do": reading.get("tudo")},
        })


def main() -> None:
    log(f"[BRIDGE] SERIAL_PORT={SERIAL_PORT} BAUD={BAUD}")
    log(f"[BRIDGE] API_BASE_URL={API_BASE_URL}")
    log(f"[BRIDGE] INGEST_URL={INGEST_URL}")

    try:
        ser = serial.Serial(SERIAL_PORT, BAUD, timeout=1)
    except Exception as e:
        log(f"[BRIDGE] Serial open FAILED: {e}")
        sys.exit(2)

    log("[BRIDGE] Serial open OK")

    last_meta: Dict[str, Any] = {}
    backoff = 0.5

    while True:
        try:
            line = ser.readline().decode(errors="ignore").strip()
        except KeyboardInterrupt:
            log("[BRIDGE] Stopped by user")
            break
        except Exception as e:
            log(f"[BRIDGE] Serial read error: {e}")
            time.sleep(1.0)
            continue

        if not line:
            continue

        meta = extract_meta(line)
        if meta:
            last_meta = meta
            continue

        reading = extract_json(line)
        if not reading:
            continue

        payload = {"reading": reading, "meta": last_meta}

        ok = post_json(INGEST_URL, payload)
        if ok:
            log("[BRIDGE] Push OK (ingest)")
            backoff = 0.5
            continue

        fallback_per_sensor(reading, last_meta)
        time.sleep(backoff)
        backoff = min(backoff * 1.5, 5.0)


if __name__ == "__main__":
    main()
