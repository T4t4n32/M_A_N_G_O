"""Mission system models.

Tables:
- mango_missions       — mission lifecycle records
- mango_mission_events — append-only event log per mission
- mango_mission_commands — command queue (VPS → edge)
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.extensions import db

VALID_STATES = (
    "BOOT", "SELF_CHECK", "IDLE", "ARMED",
    "FIELD_RUNNING", "PAUSED", "RETURNING",
    "ERROR", "MISSION_FINISHED", "SYNCING", "STANDBY",
)

VALID_COMMANDS = (
    "ARM", "START_FIELD", "START_TEST",
    "PAUSE", "RESUME", "STOP",
    "SYNC_DATA", "CALIBRATE_SENSOR",
)


class Mission(db.Model):
    __tablename__ = "mango_missions"

    id = db.Column(db.Integer, primary_key=True)
    mission_id = db.Column(db.String(128), nullable=False, unique=True, index=True)
    device_id = db.Column(db.String(64), nullable=True, index=True)
    state = db.Column(db.String(32), nullable=False, default="IDLE")
    started_at = db.Column(db.DateTime(timezone=True), nullable=True)
    ended_at = db.Column(db.DateTime(timezone=True), nullable=True)
    summary = db.Column(db.JSON, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    events = db.relationship(
        "MissionEvent",
        foreign_keys="MissionEvent.mission_ref_id",
        backref="mission",
        lazy="dynamic",
    )

    def duration_seconds(self) -> int | None:
        if self.started_at and self.ended_at:
            return int((self.ended_at - self.started_at).total_seconds())
        return None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "mission_id": self.mission_id,
            "device_id": self.device_id,
            "state": self.state,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "duration_seconds": self.duration_seconds(),
            "summary": self.summary,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class MissionEvent(db.Model):
    __tablename__ = "mango_mission_events"

    id = db.Column(db.Integer, primary_key=True)
    # FK to mango_missions.mission_id (string column)
    mission_ref_id = db.Column(
        db.Integer,
        db.ForeignKey("mango_missions.id"),
        nullable=False,
        index=True,
    )
    mission_id = db.Column(db.String(128), nullable=False, index=True)
    event_type = db.Column(db.String(64), nullable=False)
    data = db.Column(db.JSON, nullable=True)
    ts = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "mission_id": self.mission_id,
            "event_type": self.event_type,
            "data": self.data,
            "ts": self.ts.isoformat(),
        }


class MissionCommand(db.Model):
    __tablename__ = "mango_mission_commands"

    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(64), nullable=False, index=True)
    mission_id = db.Column(db.String(128), nullable=True, index=True)
    command = db.Column(db.String(64), nullable=False)
    params = db.Column(db.JSON, nullable=True)
    issued_by = db.Column(
        db.Integer,
        db.ForeignKey("mango_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    issued_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    status = db.Column(db.String(32), nullable=False, default="pending")
    delivered_at = db.Column(db.DateTime(timezone=True), nullable=True)
    acknowledged_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "device_id": self.device_id,
            "mission_id": self.mission_id,
            "command": self.command,
            "params": self.params,
            "issued_by": self.issued_by,
            "issued_at": self.issued_at.isoformat(),
            "status": self.status,
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
        }
