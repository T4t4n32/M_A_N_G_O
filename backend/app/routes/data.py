# backend/app/routes/data.py
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.sensor import SensorStation, Sensor, SensorData

api = Blueprint("api", __name__, url_prefix="/api/v1")


def _utcnow():
    return datetime.now(timezone.utc)


@api.post("/ingest")
def ingest():
    payload = request.get_json(force=True, silent=False) or {}

    station_payload = payload.get("station") or {}
    station_name = (station_payload.get("name") or "MANGO Station").strip()

    station = SensorStation.query.filter_by(name=station_name).first()
    if station is None:
        station = SensorStation(
            name=station_name,
            location=station_payload.get("location"),
            lat=station_payload.get("lat"),
            lon=station_payload.get("lon"),
        )
        db.session.add(station)
        db.session.flush()  # obtiene station.id

    readings = payload.get("readings") or []
    inserted = 0

    for r in readings:
        sensor_type = str(r.get("type", "unknown")).strip().lower()
        label = str(r.get("label", "")).strip()
        unit = r.get("unit")

        # value obligatorio
        if "value" not in r:
            continue

        try:
            value = float(r["value"])
        except Exception:
            continue

        ts = _utcnow()
        if r.get("ts"):
            # Si llega ts ISO, lo intentamos parsear; si falla, usamos now
            try:
                ts = datetime.fromisoformat(str(r["ts"]).replace("Z", "+00:00"))
            except Exception:
                ts = _utcnow()

        sensor = (
            Sensor.query.filter_by(station_id=station.id, sensor_type=sensor_type, label=label)
            .first()
        )
        if sensor is None:
            sensor = Sensor(
                station_id=station.id,
                sensor_type=sensor_type,
                label=label,
                unit=unit,
            )
            db.session.add(sensor)
            db.session.flush()

        db.session.add(
            SensorData(
                sensor_id=sensor.id,
                ts=ts,
                value=value,
                raw=r,
            )
        )
        inserted += 1

    db.session.commit()
    return jsonify(ok=True, inserted=inserted), 200


@api.get("/latest")
def latest():
    # Devuelve el último dato por sensor (simple y útil para dashboard luego)
    sensors = Sensor.query.all()
    out = []
    for s in sensors:
        last = (
            SensorData.query.filter_by(sensor_id=s.id)
            .order_by(SensorData.ts.desc())
            .first()
        )
        out.append(
            {
                "station_id": s.station_id,
                "sensor_id": s.id,
                "type": s.sensor_type,
                "label": s.label,
                "unit": s.unit,
                "ts": (last.ts.isoformat() if last else None),
                "value": (last.value if last else None),
            }
        )
    return jsonify(out), 200
