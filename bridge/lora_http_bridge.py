import json
import os
import time
from datetime import datetime, timezone

import requests
import serial


SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyMANGO")
SERIAL_BAUD = int(os.getenv("SERIAL_BAUD", "9600"))
API_URL = os.getenv("API_URL", "http://backend:5000/api/v1/ingest")
STATION_NAME = os.getenv("STATION_NAME", "MANGO Station")
SPOOL_FILE = os.getenv("SPOOL_FILE", "/app/spool.jsonl")
POST_TIMEOUT = float(os.getenv("POST_TIMEOUT", "5"))


def utc_iso():
    return datetime.now(timezone.utc).isoformat()


def spool(payload):
    try:
        with open(SPOOL_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception:
        pass


def flush_spool():
    if not os.path.exists(SPOOL_FILE):
        return
    try:
        with open(SPOOL_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
        if not lines:
            return

        kept = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
                if post_payload(payload):
                    continue
                kept.append(line)
            except Exception:
                kept.append(line)

        with open(SPOOL_FILE, "w", encoding="utf-8") as f:
            for line in kept:
                f.write(line + "\n")
    except Exception:
        pass


def post_payload(payload):
    try:
        r = requests.post(API_URL, json=payload, timeout=POST_TIMEOUT)
        return 200 <= r.status_code < 300
    except Exception:
        return False


def normalize_line(line: str):
    """
    Acepta:
      - JSON completo: {"station":..., "readings":[...]}
      - JSON de una lectura: {"type":"ph","value":7.1,...}
    """
    line = line.strip()
    if not line:
        return None

    try:
        obj = json.loads(line)
    except Exception:
        return None

    if isinstance(obj, dict) and "readings" in obj:
        if "station" not in obj:
            obj["station"] = {"name": STATION_NAME}
        return obj

    if isinstance(obj, dict) and "type" in obj and "value" in obj:
        return {
            "station": {"name": STATION_NAME},
            "readings": [{
                "type": obj.get("type"),
                "value": obj.get("value"),
                "unit": obj.get("unit"),
                "label": obj.get("label", ""),
                "ts": obj.get("ts", utc_iso()),
            }]
        }

    return None


def main():
    while True:
        # Reintenta infinito: si desconectas el RX, NO se cae el stack, solo reintenta.
        try:
            ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1)
            print(f"[bridge] connected {SERIAL_PORT} @ {SERIAL_BAUD}")
        except Exception as e:
            print(f"[bridge] waiting serial... ({e})")
            time.sleep(2)
            continue

        try:
            while True:
                flush_spool()

                raw = ser.readline().decode("utf-8", errors="ignore")
                payload = normalize_line(raw)
                if not payload:
                    continue

                ok = post_payload(payload)
                if not ok:
                    spool(payload)
                    print("[bridge] backend down -> spooled")
                else:
                    print("[bridge] sent")
        except Exception as e:
            print(f"[bridge] serial error -> reconnect ({e})")
            time.sleep(1)


if __name__ == "__main__":
    main()
