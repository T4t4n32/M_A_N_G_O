from datetime import datetime, timezone

from app.extensions import db
from app.models.sensor import Sensor, SensorData, SensorStation

DEFAULT_STATION_NAME = "MANGO Station"

_SENSOR_DEFAULTS = [
    {"type": "ph",          "unit": "pH",  "label": "Sensor pH"},
    {"type": "temp",        "unit": "C",   "label": "Temperatura"},
    {"type": "turbidity",   "unit": "NTU", "label": "Turbidez"},
]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _get_or_create_default_station() -> SensorStation:
    st = SensorStation.query.filter_by(name=DEFAULT_STATION_NAME).first()
    if not st:
        st = SensorStation(name=DEFAULT_STATION_NAME)
        db.session.add(st)
        db.session.flush()
    return st


def ensure_default_sensors() -> None:
    st = _get_or_create_default_station()
    for d in _SENSOR_DEFAULTS:
        exists = Sensor.query.filter_by(
            station_id=st.id, type=d["type"], label=d["label"]
        ).first()
        if not exists:
            db.session.add(Sensor(
                station_id=st.id,
                type=d["type"],
                unit=d["unit"],
                label=d["label"],
            ))
    db.session.commit()


def insert_reading(sensor_type: str, value, *, timestamp=None):
    ensure_default_sensors()

    st = _get_or_create_default_station()
    sensor = Sensor.query.filter_by(station_id=st.id, type=sensor_type).first()
    if not sensor:
        raise ValueError(f"Sensor desconocido: {sensor_type}")

    ts = timestamp or _utcnow()
    if isinstance(ts, str):
        ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))

    data = SensorData(
        sensor_id=sensor.id,
        value=float(value),
        ts=ts,
    )
    db.session.add(data)
    db.session.commit()
    return data
