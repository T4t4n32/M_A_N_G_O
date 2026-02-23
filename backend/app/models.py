"""
Database models for sensor stations, sensors and readings.

These SQLAlchemy model classes define the schema for the backend
database. A station may have multiple sensors, and each sensor can
produce multiple readings over time. Timestamps are stored with
timezone awareness using UTC by default.
"""

from __future__ import annotations

from datetime import datetime, timezone

from .extensions import db


class SensorStation(db.Model):
    """Represents a physical sensor station.

    Attributes
    ----------
    id : int
        Primary key.
    name : str
        Unique name of the station.
    created_at : datetime
        Timestamp when the station was created.
    """
    __tablename__ = "sensor_stations"

    id: int = db.Column(db.Integer, primary_key=True)
    name: str = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class Sensor(db.Model):
    """Represents a sensor attached to a station.

    Each sensor has a type (e.g., temperature, salinity) and optional
    label and unit. The combination of station ID and type is
    unique.
    """
    __tablename__ = "sensors"

    id: int = db.Column(db.Integer, primary_key=True)
    station_id: int = db.Column(
        db.Integer, db.ForeignKey("sensor_stations.id"), nullable=False, index=True
    )
    type: str = db.Column(db.String(64), nullable=False, index=True)
    label: str = db.Column(db.String(120), nullable=True, default="")
    unit: str | None = db.Column(db.String(32), nullable=True)

    __table_args__ = (
        db.UniqueConstraint("station_id", "type", name="uq_station_sensor_type"),
    )


class SensorReading(db.Model):
    """Represents a single sensor reading taken at a specific time."""

    __tablename__ = "sensor_readings"

    id: int = db.Column(db.Integer, primary_key=True)
    station_id: int = db.Column(
        db.Integer, db.ForeignKey("sensor_stations.id"), nullable=False, index=True
    )
    sensor_id: int = db.Column(
        db.Integer, db.ForeignKey("sensors.id"), nullable=False, index=True
    )
    type: str = db.Column(db.String(64), nullable=False, index=True)
    value: float = db.Column(db.Float, nullable=False)
    ts = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True
    )
