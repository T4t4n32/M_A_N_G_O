from flask import Blueprint, request, jsonify
from app.models.sensor import Sensor, SensorData
from app.services.data_service import ensure_default_sensors, insert_reading
from app.extensions import db

api = Blueprint("api", __name__)

@api.get("/latest")
def latest():
    ensure_default_sensors()

    out = {}
    for key in ["ph", "temperature", "turbidity"]:
        sensor = Sensor.query.filter_by(key=key).first()

        last = (SensorData.query
                .filter_by(sensor_id=sensor.id)
                .order_by(SensorData.timestamp.desc())
                .first())

        last_valid = (SensorData.query
                      .filter_by(sensor_id=sensor.id, valid=True)
                      .order_by(SensorData.timestamp.desc())
                      .first())

        out[key] = {
            "value": (last.value if last else None),
            "unit": sensor.unit,
            "timestamp": (last.timestamp.isoformat() if last else None),
            "valid": (last.valid if last else False),
            "reason": (last.reason if last else "NO_DATA"),
            "quality": (last.quality if last else "error"),
            "calibration_status": sensor.calibration_status,
            "message": "Sensor operativo" if last else "Sin datos",
            "last_valid": {
                "value": (last_valid.value if last_valid else None),
                "timestamp": (last_valid.timestamp.isoformat() if last_valid else None),
            }
        }

    return jsonify(out)

@api.get("/history/series")
def history_series():
    ensure_default_sensors()
    limit = int(request.args.get("limit", 50))

    out = { "ph": [], "temperature": [], "turbidity": [] }
    for key in out.keys():
        sensor = Sensor.query.filter_by(key=key).first()
        rows = (SensorData.query
                .filter_by(sensor_id=sensor.id)
                .order_by(SensorData.timestamp.desc())
                .limit(limit)
                .all())
        rows.reverse()  # cronológico

        out[key] = [
            {
                "timestamp": r.timestamp.isoformat(),
                "value": r.value,
                "valid": r.valid,
                "reason": r.reason,
                "quality": r.quality,
            } for r in rows
        ]

    return jsonify(out)

@api.post("/ingest")
def ingest():
    """
    Endpoint para el futuro: estación/Jetson/ESP32 envía lectura REAL.
    Body ejemplo:
      {"sensor_key":"ph", "value":7.12, "timestamp":"2026-02-04T10:00:00Z", "meta":{"fault":false}}
    """
    payload = request.get_json(force=True, silent=False)
    sensor_key = payload.get("sensor_key")
    value = payload.get("value")
    timestamp = payload.get("timestamp")
    meta = payload.get("meta") or {}

    row = insert_reading(sensor_key, value, timestamp=timestamp, meta=meta)

    return jsonify({
        "ok": True,
        "id": row.id,
        "sensor_key": sensor_key,
        "value": row.value,
        "timestamp": row.timestamp.isoformat(),
        "valid": row.valid,
        "reason": row.reason,
        "quality": row.quality,
    }), 201
