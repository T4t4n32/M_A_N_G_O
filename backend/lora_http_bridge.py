import json
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import requests
import serial


def env(name: str, default: str) -> str:
    v = os.getenv(name)
    return default if v is None or v == "" else v


SERIAL_PORT = env("SERIAL_PORT", "/dev/ttyMANGO")
BAUDRATE = int(env("BAUDRATE", "9600"))
READ_TIMEOUT_S = float(env("READ_TIMEOUT_S", "1.0"))

API_URL = env("API_URL", "http://backend:5000/api/v1/ingest")
HTTP_TIMEOUT_S = float(env("HTTP_TIMEOUT_S", "5.0"))

STATION_NAME = env("STATION_NAME", "MANGO Station")
LOG_LEVEL = env("LOG_LEVEL", "INFO").upper()

# Acepta:
# 1) JSON por serial (ideal)
# 2) Formato tipo: ph=7.1,temp=24.6,turbidity=12.2
# 3) Formato tipo: ph:7.1 temperature:24.6 turbidity:12.2
KV_RE = re.compile(r"([a-zA-Z_]+)\s*[:=]\s*([-+]?\d+(\.\d+)?)")


def log(level: str, msg: str) -> None:
    levels = ["DEBUG", "INFO", "WARNING", "ERROR"]
    if levels.index(level) >= levels.index(LOG_LEVEL):
        print(f"[{level}] {msg}", flush=True)


def normalize_key(k: str) -> str:
    k = k.strip().lower()
    if k in ["temp", "temperature", "t"]:
        return "temperature"
    if k in ["ph"]:
        return "ph"
    if k in ["turb", "turbidity", "ntu"]:
        return "turbidity"
    return k


def parse_line(line: str) -> Optional[Dict[str, Any]]:
    raw = line.strip()
    if not raw:
        return None

    # Caso 1: JSON completo por serial
    if raw.startswith("{") and raw.endswith("}"):
        try:
            obj = json.loads(raw)
            # Soporta dos estilos:
            # A) {"ph":7.1,"temperature":24.6,"turbidity":12.2}
            # B) {"readings":[{"type":"ph","value":7.1},...], "station":{...}}
            return obj
        except Exception:
            log("WARNING", f"JSON inválido por serial: {raw[:160]}")
            return None

    # Caso 2/3: key=value o key:value
    matches = KV_RE.findall(raw)
    if not matches:
        return None

    data: Dict[str, float] = {}
    for k, v, _ in matches:
        nk = normalize_key(k)
        try:
            data[nk] = float(v)
        except ValueError:
            continue

    if not data:
        return None

    return data


def to_ingest_payload(parsed: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    # Si ya viene en formato ingest
    if "readings" in parsed:
        station = parsed.get("station") or {"name": STATION_NAME}
        readings = parsed.get("readings")
        if isinstance(readings, list) and len(readings) > 0:
            return {"station": station, "readings": readings}
        return None

    # Si viene en formato simple de keys
    readings: List[Dict[str, Any]] = []
    for k, v in parsed.items():
        k2 = normalize_key(str(k))
        if k2 in ["ph", "temperature", "turbidity"]:
            try:
                readings.append({"type": k2, "value": float(v)})
            except Exception:
                continue

    if not readings:
        return None

    return {"station": {"name": STATION_NAME}, "readings": readings}


def post_payload(payload: Dict[str, Any]) -> Tuple[bool, str]:
    try:
        r = requests.post(API_URL, json=payload, timeout=HTTP_TIMEOUT_S)
        if 200 <= r.status_code < 300:
            return True, f"{r.status_code} {r.text.strip()}"
        return False, f"{r.status_code} {r.text.strip()}"
    except Exception as e:
        return False, str(e)


def main() -> None:
    log("INFO", f"Bridge iniciando. SERIAL_PORT={SERIAL_PORT}, BAUDRATE={BAUDRATE}")
    log("INFO", f"API_URL={API_URL}, STATION_NAME={STATION_NAME}")

    # Backoff simple para cuando falle HTTP o serial
    backoff = 1.0
    max_backoff = 15.0

    while True:
        try:
            with serial.Serial(SERIAL_PORT, BAUDRATE, timeout=READ_TIMEOUT_S) as ser:
                log("INFO", f"Serial abierto OK: {SERIAL_PORT}")
                backoff = 1.0

                while True:
                    try:
                        line = ser.readline().decode("utf-8", errors="ignore").strip()
                    except Exception as e:
                        log("ERROR", f"Error leyendo serial: {e}")
                        break

                    if not line:
                        continue

                    parsed = parse_line(line)
                    if parsed is None:
                        log("DEBUG", f"Ignorado: {line[:160]}")
                        continue

                    payload = to_ingest_payload(parsed)
                    if payload is None:
                        log("DEBUG", f"Sin payload válido: {str(parsed)[:160]}")
                        continue

                    ok, info = post_payload(payload)
                    if ok:
                        log("INFO", f"Ingest OK: {info}")
                    else:
                        log("WARNING", f"Ingest FAIL: {info} | payload={json.dumps(payload)[:200]}")

        except Exception as e:
            log("ERROR", f"No se pudo abrir serial {SERIAL_PORT}: {e}")

        log("WARNING", f"Reintentando en {backoff:.1f}s...")
        time.sleep(backoff)
        backoff = min(max_backoff, backoff * 1.5)


if __name__ == "__main__":
    main()
