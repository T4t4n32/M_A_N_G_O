from datetime import datetime, timezone
from sqlalchemy import text

from app.extensions import db, get_redis
from app.models import SensorStation, Sensor, SensorData
from app.services.validation_service import normalize_ingest_payload


LOCK_KEY = 734001234567  # mismo lock que init_db para coherencia


def _parse_ts(ts):
    if not ts:
        return None
    if isinstance(ts, (int, float)):
        return datetime.fromtimestamp(float(ts), tz=timezone.utc)
    if isinstance(ts, str):
        s = ts.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            return None
    return None


def get_or_create_station(name: str) -> SensorStation:
    st = SensorStation.query.filter_by(name=name).first()
    if st:
        return st
    st = SensorStation(name=name)
    db.session.add(st)
    db.session.flush()
    return st


def get_or_create_sensor(station_id: int, rtype: str, unit, label) -> Sensor:
    s = Sensor.query.filter_by(station_id=station_id, type=rtype).first()
    if s:
        if unit and s.unit != unit:
            s.unit = unit
        if label is not None and s.label != label:
            s.label = label
        db.session.flush()
        return s

    s = Sensor(station_id=station_id, type=rtype, unit=unit, label=label)
    db.session.add(s)
    db.session.flush()
    return s


def ingest(payload) -> int:
    station_name, readings = normalize_ingest_payload(payload)

    st = get_or_create_station(station_name)
    inserted = 0
    rds = get_redis()

    for r in readings:
        sensor = get_or_create_sensor(st.id, r["type"], r.get("unit"), r.get("label"))
        ts = _parse_ts(r.get("ts")) or datetime.now(timezone.utc)

        row = SensorData(
            station_id=st.id,
            sensor_id=sensor.id,
            type=r["type"],
            value=float(r["value"]),
            unit=r.get("unit"),
            label=r.get("label"),
            ts=ts,
        )
        db.session.add(row)
        inserted += 1

        if rds:
            key = f"latest:{st.id}:{r['type']}"
            rds.hset(key, mapping={
                "station_id": st.id,
                "sensor_id": sensor.id,
                "type": r["type"],
                "value": row.value,
                "unit": row.unit or "",
                "label": row.label or "",
                "ts": row.ts.isoformat(),
            })
            rds.expire(key, 86400)

    db.session.commit()
    return inserted


def latest(station_name=None, limit=200):
    q = SensorData.query
    if station_name:
        st = SensorStation.query.filter_by(name=station_name).first()
        if not st:
            return []
        q = q.filter(SensorData.station_id == st.id)

    rows = q.order_by(SensorData.ts.desc()).limit(limit).all()
    return [{
        "station_id": r.station_id,
        "sensor_id": r.sensor_id,
        "type": r.type,
        "value": r.value,
        "unit": r.unit,
        "label": r.label or "",
        "ts": r.ts.isoformat(),
    } for r in rows]
