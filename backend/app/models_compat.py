"""Compatibility DB models (additive).

Tables are separate from your main schema:
- mango_compat_stations
- mango_compat_readings
- mango_ingest_packets  (deduplication registry)
- mango_devices         (edge device registry)

Used by app.routes.compat_ingest and app.routes.readings.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.extensions import db


class CompatStation(db.Model):
    __tablename__ = "mango_compat_stations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class CompatReading(db.Model):
    __tablename__ = "mango_compat_readings"

    id = db.Column(db.Integer, primary_key=True)
    station_id = db.Column(
        db.Integer,
        db.ForeignKey("mango_compat_stations.id"),
        nullable=False,
        index=True,
    )

    type = db.Column(db.String(64), nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(32), nullable=True)
    ts = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    # Optional dedup reference — set when the reading arrived as part of a packet
    packet_id = db.Column(db.String(128), nullable=True, index=True)
    # Mission reference — set when the reading is associated with a field mission
    mission_id = db.Column(db.String(128), nullable=True, index=True)


class IngestPacket(db.Model):
    """Deduplication registry for packets sent by edge nodes.

    Stores the packet_id for each successfully ingested packet so the
    backend can detect and reject re-transmitted duplicates.
    """
    __tablename__ = "mango_ingest_packets"

    id = db.Column(db.Integer, primary_key=True)
    packet_id = db.Column(db.String(128), nullable=False, unique=True, index=True)
    device_id = db.Column(db.String(64), nullable=True, index=True)
    seq = db.Column(db.Integer, nullable=True)
    station_name = db.Column(db.String(120), nullable=True)
    created_at_device = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at_edge = db.Column(db.DateTime(timezone=True), nullable=True)
    received_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    readings_count = db.Column(db.Integer, nullable=False, default=0)


class DeviceRegistry(db.Model):
    """Registry of known edge devices that send data to the VPS.

    Updated automatically on each ingest when device_id is present in payload.
    """
    __tablename__ = "mango_devices"

    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(64), nullable=False, unique=True, index=True)
    station_name = db.Column(db.String(120), nullable=True)
    last_seen = db.Column(db.DateTime(timezone=True), nullable=True)
    last_seq = db.Column(db.Integer, nullable=True)
    total_packets = db.Column(db.Integer, nullable=False, default=0)
    status = db.Column(db.String(32), nullable=False, default="unknown")
    registered_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        now = datetime.now(timezone.utc)
        age_seconds = None
        computed_status = self.status
        if self.last_seen:
            age_seconds = int((now - self.last_seen).total_seconds())
            if age_seconds < 300:
                computed_status = "online"
            elif age_seconds < 3600:
                computed_status = "stale"
            else:
                computed_status = "offline"
        return {
            "device_id": self.device_id,
            "station_name": self.station_name,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "last_seq": self.last_seq,
            "total_packets": self.total_packets,
            "status": computed_status,
            "age_seconds": age_seconds,
            "registered_at": self.registered_at.isoformat(),
        }
