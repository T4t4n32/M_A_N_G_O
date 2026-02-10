from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from sqlalchemy import select

from app.extensions import db
from app.models.sensor import SensorStation, Sensor, SensorData, SensorType

api_bp = Blueprint("api", __name__)

def _now():
    return datetime.now(timezone.utc)

def _parse_ts(value):
    if not value:
        return _now()
    try:
        # ISO 8601
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return _now()

def _get_or_create_station(station_payload: dict) -> SensorStation:
    name = (station_payload or {}).get("name") or "MANGO Station"

    station = db.session.execute(
        select(SensorStation).where(SensorStation.name == name)
    ).scalar_one_or_none()

    if station:
        # actualiza metadata si viene
        station.location = (station_payload or {}).get("location", station.location)
        station.lat = (station_payload or {}).get("lat", station.lat)
        station.lon = (station_payload or {}).get("lon", station.lon)
        return station

    station = SensorStation(
        name=name,
        location=(station_payload or {}).get("location"),
        lat=(station_payload or {}).get("lat"),
        lon=(station_payload or {}).get("lon"),
    )
    db.session.add(station)
    db.session.flush()
    return station

def _get_or_create_sensor(station_id: int, s_type: str, unit: str | None, label: str) -> Sensor:
    label = label or ""
    sensor = db.session.execute(
        select(Sensor).where(
            Sensor.station_id == station_id,
            Sensor.type == s_type,
            Sensor.label == label,
        )
    ).scalar_one_or_none()

    if sensor:
        if unit is not None:
            sensor.unit = unit
        return sensor

    sensor = Sensor(station_id=station_id, type=s_type, unit=unit, label=label)
    db.session.add(sensor)
    db.session.flush()
    return sensor

@api_bp.post("/ingest")
def ingest():
    payload = request.get_json(silent=True) or {}
    station_payload = payload.get("station") or {}
    readings = payload.get("readings") or []

    if not isinstance(readings, list) or len(readings) == 0:
        return jsonify(ok=False, error="readings must be a non-empty list"), 400

    station = _get_or_create_station(station_payload)

    inserted = 0
    for r in readings:
        if not isinstance(r, dict):
            continue
        r_type = (r.get("type") or "unknown").strip().lower()
        if r_type not in {t.value for t in SensorType}:
            r_type = SensorType.UNKNOWN.value

        try:
            value = float(r.get("value"))
        except Exception:
            continue

        unit = r.get("unit")
        label = (r.get("label") or "").strip()
        ts = _parse_ts(r.get("ts"))

        sensor = _get_or_create_sensor(station.id, r_type, unit, label)
        db.session.add(SensorData(sensor_id=sensor.id, ts=ts, value=value))
        inserted += 1

    db.session.commit()
    return jsonify(ok=True, inserted=inserted), 200

@api_bp.get("/latest")
def latest():
    # Devuelve últimas 100 lecturas (ya “reflejables” en dashboard)
    rows = db.session.execute(
        select(SensorData, Sensor)
        .join(Sensor, Sensor.id == SensorData.sensor_id)
        .order_by(SensorData.ts.desc())
        .limit(100)
    ).all()

    out = []
    for sd, s in rows:
        out.append(
            {
                "station_id": s.station_id,
                "sensor_id": s.id,
                "type": s.type,
                "unit": s.unit,
                "label": s.label or "",
                "value": sd.value,
                "ts": sd.ts.isoformat(),
            }
        )

    return jsonify(out), 200
