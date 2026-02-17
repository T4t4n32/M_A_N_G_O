# backend/app/models/sensor.py
from __future__ import annotations

from datetime import datetime, timezone
from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class SensorStation(db.Model):
    __tablename__ = "sensor_stations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class Sensor(db.Model):
    __tablename__ = "sensors"

    id = db.Column(db.Integer, primary_key=True)
    station_id = db.Column(db.Integer, db.ForeignKey("sensor_stations.id"), nullable=False, index=True)

    type = db.Column(db.String(64), nullable=False, index=True)
    unit = db.Column(db.String(32), nullable=True)
    label = db.Column(db.String(120), nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("station_id", "type", name="uq_station_type"),
    )


class SensorData(db.Model):
    __tablename__ = "sensor_data"

    id = db.Column(db.BigInteger, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey("sensors.id"), nullable=False, index=True)

    ts = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)
