"""Compatibility DB models (additive).

Tables are separate from your main schema:
- mango_compat_stations
- mango_compat_readings

Used by app.routes.compat_ingest.
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
