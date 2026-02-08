# backend/app/models/sensor.py
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

    name = db.Column(db.String(120), nullable=False, default="MANGO Station")
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

    station_id = db.Column(
        db.Integer,
        db.ForeignKey("sensor_stations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Guardamos string para evitar líos de ENUM en Postgres al inicio
    sensor_type = db.Column(db.String(32), nullable=False, index=True)
    label = db.Column(db.String(120), nullable=False, default="")
    unit = db.Column(db.String(32), nullable=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    station = db.relationship("SensorStation", back_populates="sensors")

    data = db.relationship(
        "SensorData",
        back_populates="sensor",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        db.UniqueConstraint("station_id", "sensor_type", "label", name="uq_sensor_station_type_label"),
    )


class SensorData(db.Model):
    __tablename__ = "sensor_data"

    id = db.Column(db.Integer, primary_key=True)

    sensor_id = db.Column(
        db.Integer,
        db.ForeignKey("sensors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    ts = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    value = db.Column(db.Float, nullable=False)

    # Guarda el payload original (útil para depurar LoRa/serial)
    raw = db.Column(db.JSON, nullable=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    sensor = db.relationship("Sensor", back_populates="data")
