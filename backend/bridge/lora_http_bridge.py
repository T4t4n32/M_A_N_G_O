import json
import os
import time
from datetime import datetime, timezone

import requests
import serial
from dotenv import load_dotenv

load_dotenv()

SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
SERIAL_BAUD = int(os.getenv("SERIAL_BAUD", "115200"))
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000").rstrip("/")
API_KEY = os.getenv("API_KEY", "").strip()
STATION = os.getenv("STATION", "mango-01").strip()

SESSION = requests.Session()

def utc_iso_now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def post_reading(sensor_key: str, value, timestamp: str):
    url = f"{API_BASE_URL}/api/sensors/{sensor_key}/data"
    payload = {"value": value, "timestamp": timestamp}
    headers = {"Content-Type": "application/json"}
    if API_KEY:
        headers["X-API-Key"] = API_KEY  # si luego activas API keys en backend

    # requests permite json= para serializar automáticamente y timeout para no colgarse :contentReference[oaicite:2]{index=2}
    r = SESSION.post(url, json=payload, headers=headers, timeout=5)
    r.raise_for_status()
    return r.json()

def main():
    print(f"[bridge] Serial: {SERIAL_PORT} @ {SERIAL_BAUD}")
    print(f"[bridge] API:    {API_BASE_URL}")
    print(f"[bridge] Station:{STATION}")

    ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1)
    # pyserial: puedes leer líneas con readline() :contentReference[oaicite:3]{index=3}

    while True:
        try:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            # Esperamos una línea JSON
            msg = json.loads(line)

            sensor_key = msg.get("sensor_key")
            value = msg.get("value")
            ts = msg.get("timestamp") or utc_iso_now()

            if not sensor_key:
                print("[bridge] skip: missing sensor_key:", msg)
                continue

            # opcional: adjuntar estación (por ahora solo log)
            station = msg.get("station", STATION)

            res = post_reading(sensor_key, value, ts)
            print(f"[bridge] OK {station} {sensor_key}={value} @ {ts} -> id={res.get('stored', {}).get('id')}")

        except json.JSONDecodeError:
            print("[bridge] bad json:", line)
        except requests.RequestException as e:
            print("[bridge] http error:", str(e))
            time.sleep(1)
        except Exception as e:
            print("[bridge] error:", str(e))
            time.sleep(0.2)

if __name__ == "__main__":
    main()
