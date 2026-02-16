from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from app.extensions import db
from app.models.sensor import SensorStation, Sensor, SensorData, SensorType

api_bp = Blueprint("api_v1", __name__)

@api_bp.post("/ingest")
def ingest():
    payload = request.get_json(silent=True) or {}
    station_obj = payload.get("station") or {}
    readings = payload.get("readings") or []

    if not readings or not isinstance(readings, list):
        return jsonify({"ok": False, "error": "readings must be a non-empty list"}), 400

    station_name = (station_obj.get("name") or "MANGO Station").strip()

    # Upsert station
    station = SensorStation.query.filter_by(name=station_name).first()
    if station is None:
        station = SensorStation(name=station_name)
        db.session.add(station)
        db.session.flush()

    inserted = 0
    ts = datetime.now(timezone.utc)

    for r in readings:
        t = (r.get("type") or "").strip().lower()
        v = r.get("value", None)

        if t not in {SensorType.PH.value, SensorType.TEMPERATURE.value, SensorType.TURBIDITY.value}:
            t = SensorType.UNKNOWN.value

        try:
            value = float(v)
        except Exception:
            continue

        # Upsert sensor by (station, type)
        sensor = Sensor.query.filter_by(station_id=station.id, type=t).first()
        if sensor is None:
            sensor = Sensor(station_id=station.id, type=t, label=r.get("label") or "")
            db.session.add(sensor)
            db.session.flush()

        row = SensorData(sensor_id=sensor.id, station_id=station.id, type=t, value=value, unit=r.get("unit"), ts=ts)
        db.session.add(row)
        inserted += 1

    db.session.commit()
    return jsonify({"ok": True, "inserted": inserted}), 200


@api_bp.get("/latest")
def latest():
    # Devuelve los últimos N registros (globales)
    limit = int(request.args.get("limit", 20))

    rows = (
        SensorData.query
        .order_by(SensorData.ts.desc())
        .limit(limit)
        .all()
    )

    out = []
    for r in rows:
        out.append({
            "station_id": r.station_id,
            "sensor_id": r.sensor_id,
            "type": r.type,
            "value": r.value,
            "unit": r.unit,
            "label": r.label or "",
            "ts": r.ts.isoformat() if r.ts else None,
        })

    return jsonify(out), 200
