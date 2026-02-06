from datetime import datetime, timezone
from enum import Enum
from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class AccessStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    denied = "denied"


class AccessRequest(db.Model):
    __tablename__ = "access_requests"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, index=True)
    institution = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(32), default=AccessStatus.pending.value, index=True)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class APIKey(db.Model):
    __tablename__ = "api_keys"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    key = db.Column(db.String(128), unique=True, nullable=False, index=True)  # prototype: plain
    active = db.Column(db.Boolean, default=True, index=True)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
    last_used_at = db.Column(db.DateTime(timezone=True), nullable=True)


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(80), nullable=False)
    detail = db.Column(db.String(512), nullable=True)

    timestamp = db.Column(db.DateTime(timezone=True), default=utcnow, index=True)
