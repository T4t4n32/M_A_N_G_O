from __future__ import annotations

from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


def _utcnow():
    return datetime.now(timezone.utc)


class MangoUser(db.Model):
    __tablename__ = "mango_users"

    id         = db.Column(db.Integer, primary_key=True)
    email      = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username   = db.Column(db.String(64),  unique=True, nullable=True,  index=True)
    name       = db.Column(db.String(120), nullable=True, default="")
    role       = db.Column(db.String(32),  nullable=False, default="estudiante", index=True)
    pw_hash    = db.Column(db.String(255), nullable=False)
    active     = db.Column(db.Boolean,     nullable=False, default=True, index=True)

    created_at  = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    last_login  = db.Column(db.DateTime(timezone=True), nullable=True)
    login_count = db.Column(db.Integer, nullable=False, default=0)

    login_events = db.relationship(
        "MangoLoginEvent",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
        order_by="desc(MangoLoginEvent.ts)",
    )

    def set_password(self, password: str) -> None:
        self.pw_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.pw_hash, password)

    def record_login(self, ip: str | None = None, user_agent: str | None = None) -> "MangoLoginEvent":
        now = _utcnow()
        self.last_login  = now
        self.login_count = (self.login_count or 0) + 1
        event = MangoLoginEvent(user_id=self.id, ip=ip, user_agent=user_agent, ts=now)
        db.session.add(event)
        return event

    def to_dict(self) -> dict:
        return {
            "id":          self.id,
            "email":       self.email,
            "username":    self.username,
            "name":        self.name,
            "role":        self.role,
            "active":      self.active,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "last_login":  self.last_login.isoformat() if self.last_login else None,
            "login_count": self.login_count,
        }

    def __repr__(self) -> str:
        return f"<MangoUser {self.email} role={self.role}>"


class MangoLoginEvent(db.Model):
    __tablename__ = "mango_login_events"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("mango_users.id"), nullable=False, index=True)
    ts         = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, index=True)
    ip         = db.Column(db.String(64),  nullable=True)
    user_agent = db.Column(db.String(512), nullable=True)
    success    = db.Column(db.Boolean, nullable=False, default=True)

    user = db.relationship("MangoUser", back_populates="login_events")

    def to_dict(self) -> dict:
        return {
            "id":         self.id,
            "ts":         self.ts.isoformat() if self.ts else None,
            "ip":         self.ip,
            "user_agent": self.user_agent,
            "success":    self.success,
        }
