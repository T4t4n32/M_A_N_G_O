from datetime import datetime, timezone
from app.extensions import db
from app.models.sensor import Sensor, SensorData
from app.services.validation_service import validate_reading

def utcnow():
    return datetime.now(timezone.utc)

def ensure_default_sensors():
    """
    Crea sensores si no existen (una sola vez).
    Ajusta turbidity model a AZDM01 hoy, TSW-20M después.
    """
    defaults = [
        dict(key="ph", name="Sensor pH", unit="pH", min_value=0, max_value=14, model="GENERIC_PH", calibration_status="uncalibrated"),
        dict(key="temperature", name="Temperatura PT100", unit="°C", min_value=-50, max_value=150, model="PT100_MAX31865", calibration_status="calibrated"),
        dict(key="turbidity", name="Turbidez", unit="NTU", min_value=0, max_value=1000, model="AZDM01", calibration_status="unknown"),
    ]

    for d in defaults:
        s = Sensor.query.filter_by(key=d["key"]).first()
        if not s:
            s = Sensor(**d)
            db.session.add(s)
    db.session.commit()

def get_last_valid_value(sensor_id: int):
    row = (SensorData.query
           .filter_by(sensor_id=sensor_id, valid=True)
           .order_by(SensorData.timestamp.desc())
           .first())
    return row.value if row else None

def insert_reading(sensor_key: str, value, *, timestamp=None, meta=None):
    """
    Inserta una lectura real: guarda válido o inválido (AMBOS).
    """
    ensure_default_sensors()
    sensor = Sensor.query.filter_by(key=sensor_key).first()
    if not sensor:
        raise ValueError(f"Sensor desconocido: {sensor_key}")

    ts = timestamp or utcnow()
    if isinstance(ts, str):
        # acepta ISO string
        ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))

    last_valid = get_last_valid_value(sensor.id)

    verdict = validate_reading(sensor, value, last_valid_value=last_valid, meta=meta)

    data = SensorData(
        sensor_id=sensor.id,
        value=(None if value is None else float(value)),
        timestamp=ts,
        valid=verdict["valid"],
        reason=verdict.get("reason"),
        quality=verdict.get("quality", "error"),
    )

    db.session.add(data)
    db.session.commit()
    return data
