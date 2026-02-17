# backend/app/services/data_service.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.extensions import db
from app.models.sensor import SensorStation, Sensor, SensorData


def _utcnow():
    return datetime.now(timezone.utc)


def _get_station(name: str) -> SensorStation:
    st = SensorStation.query.filter_by(name=name).first()
    if st:
        return st
    st = SensorStation(name=name)
    db.session.add(st)
    db.session.commit()
    return st


def _get_sensor(station_id: int, sensor_type: str, unit: Optional[str], label: Optional[str]) -> Sensor:
    s = Sensor.query.filter_by(station_id=station_id, type=sensor_type).first()
    if s:
        # opcional: actualiza unit/label si llegan
        if unit is not None:
            s.unit = unit
        if label is not None:
            s.label = label
        db.session.commit()
        return s

    s = Sensor(station_id=station_id, type=sensor_type, unit=unit, label=label)
    db.session.add(s)
    db.session.commit()
    return s


def ingest_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    station = payload.get("station") or {}
    station_name = (station.get("name") or "MANGO Station").strip()

    readings = payload.get("readings")
    if not isinstance(readings, list) or not readings:
        return {"ok": False, "error": "readings_required", "inserted": 0}

    st = _get_station(station_name)

    inserted = 0
    for r in readings:
        if not isinstance(r, dict):
            continue
        r_type = (r.get("type") or "").strip()
        if not r_type:
            continue

        try:
            value = float(r.get("value"))
        except Exception:
            continue

        unit = r.get("unit")
        label = r.get("label")
        sensor = _get_sensor(st.id, r_type, unit, label)

        ts = _utcnow()
        db.session.add(SensorData(sensor_id=sensor.id, ts=ts, value=value))
        inserted += 1

    if inserted:
        db.session.commit()

    return {"ok": True, "inserted": inserted}


def latest_rows(station_name: Optional[str], limit: int) -> List[Dict[str, Any]]:
    q = (
        db.session.query(
            SensorData.ts,
            Sensor.type,
            Sensor.unit,
            Sensor.label,
            Sensor.id.label("sensor_id"),
            SensorStation.id.label("station_id"),
        )
        .join(Sensor, Sensor.id == SensorData.sensor_id)
        .join(SensorStation, SensorStation.id == Sensor.station_id)
    )

    if station_name:
        q = q.filter(SensorStation.name == station_name)

    q = q.order_by(SensorData.ts.desc()).limit(limit)

    out = []
    for row in q.all():
        out.append(
            {
                "ts": row.ts.isoformat(),
                "type": row.type,
                "unit": row.unit,
                "label": row.label or "",
                "sensor_id": row.sensor_id,
                "station_id": row.station_id,
            }
        )
    return out
