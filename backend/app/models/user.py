from datetime import datetime, timezone
from enum import Enum
from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    admin = "admin"
    viewer = "viewer"


class Institution(db.Model):
    __tablename__ = "institutions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    role = db.Column(db.String(32), default=UserRole.viewer.value, index=True)

    institution_id = db.Column(db.Integer, db.ForeignKey("institutions.id"), nullable=True)
    institution = db.relationship("Institution", backref=db.backref("users", lazy=True))

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow)
