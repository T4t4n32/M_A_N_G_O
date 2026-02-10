from enum import Enum
from datetime import datetime, timezone

from app.extensions import db

class SensorType(str, Enum):
    PH = "ph"
    TEMPERATURE = "temperature"
    TURBIDITY = "turbidity"
    UNKNOWN = "unknown"

class SensorStation(db.Model):
    __tablename__ = "sensor_stations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True, default="MANGO Station")
    location = db.Column(db.String(255), nullable=True)
    lat = db.Column(db.Float, nullable=True)
    lon = db.Column(db.Float, nullable=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    sensors = db.relationship(
        "Sensor",
        back_populates="station",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

class Sensor(db.Model):
    __tablename__ = "sensors"

    id = db.Column(db.Integer, primary_key=True)
    station_id = db.Column(db.Integer, db.ForeignKey("sensor_stations.id"), nullable=False)

    type = db.Column(db.String(50), nullable=False)
    unit = db.Column(db.String(32), nullable=True)
    label = db.Column(db.String(120), nullable=True, default="")

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    station = db.relationship("SensorStation", back_populates="sensors")

    __table_args__ = (
        db.UniqueConstraint("station_id", "type", "label", name="uq_sensor_station_type_label"),
    )

class SensorData(db.Model):
    __tablename__ = "sensor_data"

    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey("sensors.id"), nullable=False)

    ts = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    value = db.Column(db.Float, nullable=False)

    sensor = db.relationship("Sensor")

    __table_args__ = (
        db.Index("ix_sensor_data_sensor_ts", "sensor_id", "ts"),
    )
