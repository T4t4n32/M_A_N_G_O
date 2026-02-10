import json
import os
import time
import logging
from datetime import datetime, timezone

import requests
import serial

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, LOG_LEVEL, logging.INFO), format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("mango-bridge")

SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyMANGO")
BAUDRATE = int(os.getenv("BAUDRATE", "9600"))
READ_TIMEOUT_S = float(os.getenv("READ_TIMEOUT_S", "1.0"))

API_URL = os.getenv("API_URL", "http://backend:5000/api/v1/ingest")
HTTP_TIMEOUT_S = float(os.getenv("HTTP_TIMEOUT_S", "5.0"))
STATION_NAME = os.getenv("STATION_NAME", "MANGO Station")

KNOWN_KEYS = {
    "ph": "ph",
    "temp": "temperature",
    "temperature": "temperature",
    "turb": "turbidity",
    "turbidity": "turbidity",
}

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def parse_line(line: str):
    """
    Soporta:
    1) JSON: {"ph":7.1,"temperature":24.6,"turbidity":12.2}
    2) key=val CSV: ph=7.1,temp=24.6,turbidity=12.2
    3) CSV simple: 7.1,24.6,12.2  -> (ph,temp,turbidity) (solo si llega exacto)
    """
    line = line.strip()
    if not line:
        return []

    # JSON
    if line.startswith("{") and line.endswith("}"):
        try:
            obj = json.loads(line)
            readings = []
            for k, v in obj.items():
                k2 = KNOWN_KEYS.get(str(k).strip().lower())
                if not k2:
                    continue
                try:
                    fv = float(v)
                except Exception:
                    continue
                readings.append({"type": k2, "value": fv, "ts": now_iso()})
            return readings
        except Exception:
            return []

    # key=val
    if "=" in line:
        readings = []
        parts = [p.strip() for p in line.split(",") if p.strip()]
        for p in parts:
            if "=" not in p:
                continue
            k, v = [x.strip() for x in p.split("=", 1)]
            k2 = KNOWN_KEYS.get(k.lower())
            if not k2:
                continue
            try:
                fv = float(v)
            except Exception:
                continue
            readings.append({"type": k2, "value": fv, "ts": now_iso()})
        return readings

    # CSV simple
    if "," in line:
        parts = [p.strip() for p in line.split(",")]
        if len(parts) == 3:
            try:
                ph = float(parts[0])
                temp = float(parts[1])
                turb = float(parts[2])
                return [
                    {"type": "ph", "value": ph, "ts": now_iso()},
                    {"type": "temperature", "value": temp, "ts": now_iso()},
                    {"type": "turbidity", "value": turb, "ts": now_iso()},
                ]
            except Exception:
                return []

    return []

def post_readings(readings):
    payload = {"station": {"name": STATION_NAME}, "readings": readings}
    r = requests.post(API_URL, json=payload, timeout=HTTP_TIMEOUT_S)
    r.raise_for_status()
    return r.json()

def main():
    log.info("Starting bridge: port=%s baud=%s api=%s station=%s", SERIAL_PORT, BAUDRATE, API_URL, STATION_NAME)

    while True:
        try:
            with serial.Serial(SERIAL_PORT, BAUDRATE, timeout=READ_TIMEOUT_S) as ser:
                log.info("Serial opened OK: %s", SERIAL_PORT)
                while True:
                    raw = ser.readline()
                    if not raw:
                        continue
                    try:
                        line = raw.decode("utf-8", errors="ignore").strip()
                    except Exception:
                        continue

                    readings = parse_line(line)
                    if not readings:
                        log.debug("Ignored line: %r", line)
                        continue

                    try:
                        resp = post_readings(readings)
                        log.info("Ingest OK: inserted=%s line=%r", resp.get("inserted"), line)
                    except Exception as e:
                        log.warning("Ingest FAIL: %s line=%r", e, line)

        except Exception as e:
            log.error("Serial open FAIL: %s (retrying in 2s)", e)
            time.sleep(2)

if __name__ == "__main__":
    main()
