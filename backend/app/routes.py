from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from sqlalchemy import desc

from .extensions import db
from .models import SensorStation, Sensor, SensorReading

bp = Blueprint("api", __name__)

@bp.get("/health")
def health():
    db_ok = "ok"
    try:
        db.session.execute(db.text("SELECT 1;"))
    except Exception:
        db_ok = "fail"
    return jsonify({
        "status": "ok" if db_ok == "ok" else "degraded",
        "db": db_ok,
        "redis": "ok",  # (si luego quieres ping real, lo añadimos)
        "time": datetime.now(timezone.utc).isoformat()
    }), 200

@bp.post("/api/v1/ingest")
def ingest():
    payload = request.get_json(force=True, silent=False)
    station_name = (payload.get("station") or {}).get("name") or "MANGO Station"
    readings = payload.get("readings") or []

    st = SensorStation.query.filter_by(name=station_name).first()
    if not st:
        st = SensorStation(name=station_name)
        db.session.add(st)
        db.session.flush()

    inserted = 0
    for r in readings:
        r_type = str(r.get("type", "")).strip()
        if not r_type:
            continue
        try:
            val = float(r.get("value"))
        except Exception:
            continue

        sensor = Sensor.query.filter_by(station_id=st.id, type=r_type).first()
        if not sensor:
            sensor = Sensor(station_id=st.id, type=r_type, label=r.get("label") or "", unit=r.get("unit"))
            db.session.add(sensor)
            db.session.flush()

        row = SensorReading(
            station_id=st.id,
            sensor_id=sensor.id,
            type=r_type,
            value=val,
            ts=datetime.now(timezone.utc),
        )
        db.session.add(row)
        inserted += 1

    db.session.commit()
    return jsonify({"ok": True, "inserted": inserted}), 200

@bp.get("/api/v1/latest")
def latest():
    # Devuelve últimas 50 lecturas (como ya venías viendo)
    rows = (SensorReading.query
            .order_by(desc(SensorReading.ts))
            .limit(50)
            .all())

    out = []
    for r in rows:
        out.append({
            "station_id": r.station_id,
            "sensor_id": r.sensor_id,
            "type": r.type,
            "value": r.value,
            "ts": r.ts.isoformat(),
            "label": "",
            "unit": None
        })
    return jsonify(out), 200
