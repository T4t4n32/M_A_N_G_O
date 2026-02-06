from datetime import datetime, timezone
from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class SensorType(db.Model):
    __tablename__ = "sensor_types"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(32), unique=True, nullable=False)  # ph, temperature, turbidity
    name = db.Column(db.String(80), nullable=False)
    unit = db.Column(db.String(16), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class SensorStation(db.Model):
    __tablename__ = "sensor_stations"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(32), unique=True, nullable=False)  # station-01, etc
    name = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class Sensor(db.Model):
    __tablename__ = "sensors"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(32), unique=True, nullable=False)  # ph, temperature, turbidity
    name = db.Column(db.String(80), nullable=False)
    unit = db.Column(db.String(16), nullable=False)

    min_value = db.Column(db.Float, nullable=True)
    max_value = db.Column(db.Float, nullable=True)

    model = db.Column(db.String(64), nullable=True)  # "GENERIC_PH", "PT100_MAX31865", "AZDM01"
    calibration_status = db.Column(db.String(32), default="unknown")  # calibrated/uncalibrated/unknown
    maintenance_mode = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class SensorData(db.Model):
    __tablename__ = "sensor_data"

    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey("sensors.id"), nullable=False, index=True)
    sensor = db.relationship("Sensor", backref=db.backref("data", lazy=True))

    value = db.Column(db.Float, nullable=True)
    timestamp = db.Column(db.DateTime(timezone=True), default=utcnow, index=True)

    valid = db.Column(db.Boolean, default=False, index=True)
    reason = db.Column(db.String(64), nullable=True)   # OUT_OF_RANGE_LOW, NOT_A_NUMBER, ...
    quality = db.Column(db.String(16), default="error")  # ok/warn/error/maintenance

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
