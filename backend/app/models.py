from datetime import datetime, timezone
from .extensions import db

class SensorStation(db.Model):
    __tablename__ = "sensor_stations"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class Sensor(db.Model):
    __tablename__ = "sensors"
    id = db.Column(db.Integer, primary_key=True)
    station_id = db.Column(db.Integer, db.ForeignKey("sensor_stations.id"), nullable=False, index=True)
    type = db.Column(db.String(64), nullable=False, index=True)
    label = db.Column(db.String(120), nullable=True, default="")
    unit = db.Column(db.String(32), nullable=True)

    __table_args__ = (
        db.UniqueConstraint("station_id", "type", name="uq_station_sensor_type"),
    )

class SensorReading(db.Model):
    __tablename__ = "sensor_readings"
    id = db.Column(db.Integer, primary_key=True)
    station_id = db.Column(db.Integer, db.ForeignKey("sensor_stations.id"), nullable=False, index=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey("sensors.id"), nullable=False, index=True)
    type = db.Column(db.String(64), nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)
    ts = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
