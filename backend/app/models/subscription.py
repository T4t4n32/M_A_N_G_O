"""
Modelo de suscripciones / rangos de acceso para M.A.N.G.O.

Tabla: mango_user_subscriptions

Rangos (en orden creciente de acceso):
  dataline_low   — trimestral, reportes básicos
  dataline_high  — trimestral, reportes ampliados + datasets + asistente
  institutional  — acceso institucional completo, sin vencimiento por defecto
  admin          — derivado de MangoUser.role, no requiere registro aquí
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import or_

from app.extensions import db

VALID_TIERS = (
    "registrado_basico",
    "documental_premium",
    "dataline_low",
    "dataline_high",
    "institutional",
)

TIER_ORDER: dict[str, int] = {
    "none":              0,
    "registrado_basico": 1,
    "documental_premium": 2,
    "dataline_low":      3,
    "dataline_high":     4,
    "institutional":     5,
    "admin":             6,
}

TIER_LABELS: dict[str, str] = {
    "none":              "Público",
    "registrado_basico": "Registrado Básico",
    "documental_premium": "Documental Premium",
    "dataline_low":      "DataLine Low",
    "dataline_high":     "DataLine High",
    "institutional":     "Institucional",
    "admin":             "Administrativo Interno",
}

DATALINE_TIERS = {"dataline_low", "dataline_high"}
MONTHLY_DAYS  = 30
QUARTERLY_DAYS = 90


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserSubscription(db.Model):
    __tablename__ = "mango_user_subscriptions"

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(
        db.Integer,
        db.ForeignKey("mango_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tier         = db.Column(db.String(32), nullable=False, index=True)
    granted_at   = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    expires_at   = db.Column(db.DateTime(timezone=True), nullable=True)
    granted_by_id = db.Column(
        db.Integer,
        db.ForeignKey("mango_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    notes        = db.Column(db.Text, nullable=True)
    revoked_at   = db.Column(db.DateTime(timezone=True), nullable=True)
    revoked_by_id = db.Column(
        db.Integer,
        db.ForeignKey("mango_users.id", ondelete="SET NULL"),
        nullable=True,
    )

    user       = db.relationship("MangoUser", foreign_keys=[user_id])
    granted_by = db.relationship("MangoUser", foreign_keys=[granted_by_id])
    revoked_by = db.relationship("MangoUser", foreign_keys=[revoked_by_id])

    # ------------------------------------------------------------------
    def is_active(self) -> bool:
        if self.revoked_at is not None:
            return False
        if self.expires_at is not None and self.expires_at <= _utcnow():
            return False
        return True

    def to_dict(self) -> dict:
        return {
            "id":            self.id,
            "user_id":       self.user_id,
            "tier":          self.tier,
            "granted_at":    self.granted_at.isoformat() if self.granted_at else None,
            "expires_at":    self.expires_at.isoformat() if self.expires_at else None,
            "granted_by_id": self.granted_by_id,
            "notes":         self.notes,
            "revoked_at":    self.revoked_at.isoformat() if self.revoked_at else None,
            "active":        self.is_active(),
        }

    @classmethod
    def active_for_user(cls, user_id: int) -> "UserSubscription | None":
        now = _utcnow()
        return (
            cls.query
            .filter(
                cls.user_id == user_id,
                cls.revoked_at.is_(None),
                or_(cls.expires_at.is_(None), cls.expires_at > now),
            )
            .order_by(cls.granted_at.desc())
            .first()
        )

    @classmethod
    def history_for_user(cls, user_id: int, limit: int = 50) -> list["UserSubscription"]:
        return (
            cls.query
            .filter_by(user_id=user_id)
            .order_by(cls.granted_at.desc())
            .limit(limit)
            .all()
        )


def tier_for_user(user) -> str:
    """Return the effective tier string for a MangoUser instance."""
    if getattr(user, "role", None) == "admin":
        return "admin"
    sub = UserSubscription.active_for_user(user.id)
    return sub.tier if sub else "none"


def default_expires_at(tier: str) -> datetime | None:
    """Return default expiry for a tier; None = never expires."""
    if tier == "registrado_basico":
        return _utcnow() + timedelta(days=MONTHLY_DAYS)
    if tier == "documental_premium":
        return _utcnow() + timedelta(days=QUARTERLY_DAYS)
    if tier in DATALINE_TIERS:
        return _utcnow() + timedelta(days=QUARTERLY_DAYS)
    return None  # institutional: no expiry


def has_min_tier(user, min_tier: str) -> bool:
    """Return True if user's effective tier is >= min_tier."""
    effective = tier_for_user(user)
    return TIER_ORDER.get(effective, 0) >= TIER_ORDER.get(min_tier, 0)
