from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from flask import Blueprint, jsonify, request

sensors_data_bp = Blueprint("sensors_data", __name__)

# 0 = OK, 1 = OFFLINE, 2 = OUT_OF_RANGE
STATUS_OK = 0
STATUS_OFFLINE = 1
STATUS_OOR = 2

SENSORS = {
    "temperature": {"unit": "C"},
    "ph": {"unit": "pH"},
    "turbidity": {"unit": "NTU"},
}

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

@dataclass
class Reading:
    sensor: str
    value: float
    status: int
    unit: str
    ts: str
    raw: Optional[float] = None
    voltage: Optional[float] = None
    meta: Optional[Dict[str, Any]] = None

LATEST: Dict[str, Reading] = {}

def _parse_float(v: Any) -> Optional[float]:
    try:
        if v is None:
            return None
        return float(v)
    except Exception:
        return None

def _parse_int(v: Any) -> Optional[int]:
    try:
        if v is None:
            return None
        return int(v)
    except Exception:
        return None

def _store(sensor: str, value: float, status: int,
           raw: Optional[float] = None, voltage: Optional[float] = None,
           meta: Optional[Dict[str, Any]] = None) -> Reading:
    r = Reading(
        sensor=sensor,
        value=value,
        status=status,
        unit=SENSORS[sensor]["unit"],
        ts=_now_iso(),
        raw=raw,
        voltage=voltage,
        meta=meta or {},
    )
    LATEST[sensor] = r
    return r

@sensors_data_bp.post("/api/data/ingest")
def ingest():
    """
    Endpoint principal (1 POST por paquete):
    Acepta:
      - {"reading": {...LoRa JSON...}, "meta": {...}}
      - o directamente el JSON del LoRa
    """
    data = request.get_json(silent=True) or {}
    reading = data.get("reading") if isinstance(data.get("reading"), dict) else data

    meta = data.get("meta") if isinstance(data.get("meta"), dict) else {}
    for k in ("rssi", "snr", "freqerr"):
        if k in data and k not in meta:
            meta[k] = data[k]

    updated = []

    # Temperature: t, ts, tr
    if "t" in reading or "ts" in reading or "tr" in reading:
        value = _parse_float(reading.get("t"))
        status = _parse_int(reading.get("ts")) or STATUS_OFFLINE
        raw = _parse_float(reading.get("tr"))
        if value is None:
            value = -1.0
        _store("temperature", value, status, raw=raw, meta=meta)
        updated.append("temperature")

    # pH: ph, phs, phv, phr
    if "ph" in reading or "phs" in reading or "phv" in reading or "phr" in reading:
        value = _parse_float(reading.get("ph"))
        status = _parse_int(reading.get("phs")) or STATUS_OFFLINE
        voltage = _parse_float(reading.get("phv"))
        raw = _parse_float(reading.get("phr"))
        if value is None:
            value = -1.0
        _store("ph", value, status, raw=raw, voltage=voltage, meta=meta)
        updated.append("ph")

    # Turbidity: tu/tunu, tus, tuv, tur, tudo
    if "tu" in reading or "tunu" in reading or "tus" in reading:
        value = _parse_float(reading.get("tunu"))
        if value is None:
            value = _parse_float(reading.get("tu"))
        status = _parse_int(reading.get("tus")) or STATUS_OFFLINE
        voltage = _parse_float(reading.get("tuv"))
        raw = _parse_float(reading.get("tur"))

        meta2 = dict(meta)
        if "tudo" in reading:
            meta2["turb_do"] = reading.get("tudo")

        if value is None:
            value = -1.0
        _store("turbidity", value, status, raw=raw, voltage=voltage, meta=meta2)
        updated.append("turbidity")

    return jsonify({"ok": True, "updated": updated}), 200

@sensors_data_bp.post("/api/sensors/<sensor_key>/data")
def ingest_single(sensor_key: str):
    if sensor_key not in SENSORS:
        return jsonify({"error": "unknown sensor", "sensor": sensor_key}), 404

    payload = request.get_json(silent=True) or {}
    value = _parse_float(payload.get("value"))
    status = _parse_int(payload.get("status")) or STATUS_OFFLINE
    raw = _parse_float(payload.get("raw"))
    voltage = _parse_float(payload.get("voltage"))
    meta = payload.get("meta") if isinstance(payload.get("meta"), dict) else {}

    if value is None:
        return jsonify({"error": "missing/invalid 'value'"}), 400

    _store(sensor_key, value, status, raw=raw, voltage=voltage, meta=meta)
    return jsonify({"ok": True, "stored": sensor_key}), 200

@sensors_data_bp.get("/api/data/latest/<sensor_key>")
def latest(sensor_key: str):
    if sensor_key not in SENSORS:
        return jsonify({"error": "unknown sensor", "sensor": sensor_key}), 404

    r = LATEST.get(sensor_key)
    if not r:
        r = Reading(
            sensor=sensor_key,
            value=-1.0,
            status=STATUS_OFFLINE,
            unit=SENSORS[sensor_key]["unit"],
            ts=_now_iso(),
            raw=None,
            voltage=None,
            meta={},
        )
        LATEST[sensor_key] = r

    return jsonify(asdict(r)), 200
