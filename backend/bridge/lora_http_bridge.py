import os
import json
import time
import re
from datetime import datetime, timezone

import requests
import serial


SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
BAUD = int(os.getenv("BAUD", "115200"))
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")

# Buffer local para cuando la API esté caída
SPOOL_FILE = os.getenv("SPOOL_FILE", "spool.jsonl")
FLUSH_EVERY = int(os.getenv("FLUSH_EVERY", "10"))  # cada N lecturas intenta vaciar spool


JSON_RE = re.compile(r"(\{.*\})")

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def extract_json(line: str):
    # Caso 1: viene como "JSON:{...}"
    if "JSON:" in line:
        candidate = line.split("JSON:", 1)[1].strip()
        if candidate.startswith("{") and candidate.endswith("}"):
            return candidate

    # Caso 2: buscar {...} en cualquier parte
    m = JSON_RE.search(line)
    if m:
        return m.group(1)

    return None

def post_sensor(sensor_key: str, value):
    url = f"{API_BASE_URL}/api/sensors/{sensor_key}/data"
    payload = {"value": value, "timestamp": utc_now_iso()}
    r = requests.post(url, json=payload, timeout=3)
    r.raise_for_status()
    return r.json()

def spool_write(obj: dict):
    with open(SPOOL_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def spool_flush():
    if not os.path.exists(SPOOL_FILE):
        return 0

    # leer todo y reintentar
    with open(SPOOL_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    if not lines:
        return 0

    kept = []
    sent = 0
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        try:
            obj = json.loads(ln)
            post_sensor(obj["sensor_key"], obj["value"])
            sent += 1
        except Exception:
            kept.append(ln)

    # reescribir lo que no se pudo
    with open(SPOOL_FILE, "w", encoding="utf-8") as f:
        for ln in kept:
            f.write(ln + "\n")

    return sent

def map_and_send(pkt: dict):
    """
    Esperado (ejemplo):
    {
      "t": 29.76, "ts": 0,
      "ph": 7.12, "phs": 0,
      "tunu": 120.5, "tus": 0
    }

    Regla:
    - status 0 => OK => enviar valor
    - status 1 => OFFLINE => enviar None (backend reason=MISSING_VALUE)
    - status 2 => OUT_OF_RANGE => enviar valor (backend lo marca por rango)
    """
    # temperature
    ts = int(pkt.get("ts", 1))
    t_val = pkt.get("t", None)
    temp_value = None if ts == 1 else t_val

    # ph
    phs = int(pkt.get("phs", 1))
    ph_val = pkt.get("ph", None)
    ph_value = None if phs == 1 else ph_val

    # turbidity: usa NTU si existe (tunu), si no usa tu (voltaje)
    tus = int(pkt.get("tus", 1))
    tu_val = pkt.get("tunu", pkt.get("tu", None))
    turb_value = None if tus == 1 else tu_val

    # Enviar (o spool si falla)
    for key, value in [
        ("temperature", temp_value),
        ("ph", ph_value),
        ("turbidity", turb_value),
    ]:
        try:
            post_sensor(key, value)
            print(f"[BRIDGE] POST ok ({key}) value={value}")
        except Exception as e:
            print(f"[BRIDGE] POST failed ({key}): {e}")
            spool_write({"sensor_key": key, "value": value})

def main():
    print(f"[BRIDGE] SERIAL_PORT={SERIAL_PORT} BAUD={BAUD}")
    print(f"[BRIDGE] API_BASE_URL={API_BASE_URL}")

    ser = serial.Serial(SERIAL_PORT, BAUD, timeout=1)
    print("[BRIDGE] Serial open OK")

    n = 0
    while True:
        line = ser.readline().decode(errors="ignore").strip()
        if not line:
            continue

        js = extract_json(line)
        if not js:
            # imprime otras líneas si quieres debug
            continue

        try:
            pkt = json.loads(js)
        except Exception:
            continue

        map_and_send(pkt)

        n += 1
        if n % FLUSH_EVERY == 0:
            sent = spool_flush()
            if sent:
                print(f"[BRIDGE] Flushed {sent} buffered posts")

        time.sleep(0.01)

if __name__ == "__main__":
    main()
