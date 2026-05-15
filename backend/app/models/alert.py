"""Alert rules, contacts, and event log for M.A.N.G.O. SMS notifications.

Tables:
  mango_alert_rules    — threshold rules configured by admin
  mango_alert_contacts — phone numbers that receive SMS alerts
  mango_alert_events   — log of every alert dispatched by the edge node
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.extensions import db

ALERT_SENSOR_TYPES = ("ph", "temperature", "turbidity")
ALERT_LEVELS = ("warning", "critical")
ALERT_COMPARISONS = ("above", "below")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AlertRule(db.Model):
    __tablename__ = "mango_alert_rules"

    id = db.Column(db.Integer, primary_key=True)
    sensor_type = db.Column(db.String(32), nullable=False)
    comparison = db.Column(db.String(16), nullable=False)   # above | below
    threshold = db.Column(db.Float, nullable=False)
    level = db.Column(db.String(16), nullable=False)        # warning | critical
    enabled = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    def triggered_by(self, value: float) -> bool:
        if not self.enabled:
            return False
        if self.comparison == "above":
            return value > self.threshold
        if self.comparison == "below":
            return value < self.threshold
        return False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "sensor_type": self.sensor_type,
            "comparison": self.comparison,
            "threshold": self.threshold,
            "level": self.level,
            "enabled": self.enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class AlertContact(db.Model):
    __tablename__ = "mango_alert_contacts"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(32), nullable=False)   # E.164, e.g. +573001234567
    active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "active": self.active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AlertEvent(db.Model):
    __tablename__ = "mango_alert_events"

    id = db.Column(db.Integer, primary_key=True)
    station_name = db.Column(db.String(120), nullable=True)
    sensor_type = db.Column(db.String(32), nullable=False)
    value = db.Column(db.Float, nullable=True)
    alert_level = db.Column(db.String(16), nullable=False)
    rule_id = db.Column(
        db.Integer,
        db.ForeignKey("mango_alert_rules.id", ondelete="SET NULL"),
        nullable=True,
    )
    contact_id = db.Column(
        db.Integer,
        db.ForeignKey("mango_alert_contacts.id", ondelete="SET NULL"),
        nullable=True,
    )
    message = db.Column(db.Text, nullable=True)
    sms_sent = db.Column(db.Boolean, nullable=False, default=False)
    sms_sent_at = db.Column(db.DateTime(timezone=True), nullable=True)
    sms_error = db.Column(db.Text, nullable=True)
    measured_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)

    rule = db.relationship("AlertRule", foreign_keys=[rule_id])
    contact = db.relationship("AlertContact", foreign_keys=[contact_id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "station_name": self.station_name,
            "sensor_type": self.sensor_type,
            "value": self.value,
            "alert_level": self.alert_level,
            "rule_id": self.rule_id,
            "contact_id": self.contact_id,
            "message": self.message,
            "sms_sent": self.sms_sent,
            "sms_sent_at": self.sms_sent_at.isoformat() if self.sms_sent_at else None,
            "sms_error": self.sms_error,
            "measured_at": self.measured_at.isoformat() if self.measured_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
