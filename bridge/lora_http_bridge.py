import os
import time
import json
import logging
import requests
import serial
from serial import SerialException

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("mango-bridge")

SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyMANGO")
BAUDRATE = int(os.getenv("BAUDRATE", "9600"))
READ_TIMEOUT_S = float(os.getenv("READ_TIMEOUT_S", "1.0"))

API_URL = os.getenv("API_URL", "http://backend:5000/api/v1/ingest")
HTTP_TIMEOUT_S = float(os.getenv("HTTP_TIMEOUT_S", "5.0"))
STATION_NAME = os.getenv("STATION_NAME", "MANGO Station")

RETRY_S = 2.0

def to_payload(line: str) -> dict | None:
    """
    Acepta:
    - JSON completo {station:{name:"..."}, readings:[...]}
    - JSON de una lectura {"type":"ph","value":7.1,"unit":"pH"} -> lo envuelve
    - Texto simple "ph=7.1" -> lo convierte
    """
    line = line.strip()
    if not line:
        return None

    # Intento JSON
    try:
        obj = json.loads(line)
        if isinstance(obj, dict) and "station" in obj and "readings" in obj:
            return obj

        if isinstance(obj, dict) and "type" in obj and "value" in obj:
            unit = obj.get("unit", None)
            return {"station": {"name": STATION_NAME}, "readings": [{"type": obj["type"], "value": obj["value"], "unit": unit}]}
    except Exception:
        pass

    # Intento "tipo=valor"
    if "=" in line:
        k, v = line.split("=", 1)
        k = k.strip()
        try:
            v = float(v.strip())
        except Exception:
            return None
        return {"station": {"name": STATION_NAME}, "readings": [{"type": k, "value": v}]}

    return None

def post_payload(payload: dict) -> bool:
    try:
        r = requests.post(API_URL, json=payload, timeout=HTTP_TIMEOUT_S)
        if r.status_code >= 200 and r.status_code < 300:
            return True
        log.error("HTTP %s: %s", r.status_code, r.text[:200])
        return False
    except Exception as e:
        log.error("HTTP FAIL: %s", e)
        return False

def main():
    log.info("Starting bridge: port=%s baud=%s api=%s station=%s", SERIAL_PORT, BAUDRATE, API_URL, STATION_NAME)

    while True:
        try:
            with serial.Serial(SERIAL_PORT, BAUDRATE, timeout=READ_TIMEOUT_S) as ser:
                log.info("Serial opened OK: %s", SERIAL_PORT)

                while True:
                    try:
                        raw = ser.readline().decode(errors="ignore")
                    except SerialException as e:
                        log.error("Serial read FAIL: %s (reopening in %.1fs)", e, RETRY_S)
                        break

                    payload = to_payload(raw)
                    if not payload:
                        continue

                    ok = post_payload(payload)
                    if not ok:
                        # si falla la red, no matamos el loop; solo seguimos
                        time.sleep(0.2)

        except SerialException as e:
            log.error("Serial open FAIL: %s (retrying in %.1fs)", e, RETRY_S)
            time.sleep(RETRY_S)
        except Exception as e:
            log.exception("Bridge fatal error: %s (retrying in %.1fs)", e, RETRY_S)
            time.sleep(RETRY_S)

if __name__ == "__main__":
    main()
