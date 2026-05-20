"""
MangoAccessRequest — solicitudes de acceso / upgrade de tier.

Tabla: mango_access_requests

Flujo:
  1. Usuario autenticado envía POST /api/v1/access-requests  (status=pending)
  2. Admin aprueba  → status=approved, se crea UserSubscription automáticamente
  3. Admin rechaza  → status=rejected + admin_note
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.extensions import db

REQUEST_STATUSES = ("pending", "approved", "rejected")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class MangoAccessRequest(db.Model):
    __tablename__ = "mango_access_requests"

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(
        db.Integer,
        db.ForeignKey("mango_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requested_tier  = db.Column(db.String(32), nullable=False)
    motivation      = db.Column(db.Text, nullable=True)
    status          = db.Column(db.String(16), nullable=False, default="pending", index=True)
    reviewed_by_id  = db.Column(
        db.Integer,
        db.ForeignKey("mango_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at     = db.Column(db.DateTime(timezone=True), nullable=True)
    admin_note      = db.Column(db.Text, nullable=True)
    created_at      = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)

    user        = db.relationship("MangoUser", foreign_keys=[user_id])
    reviewed_by = db.relationship("MangoUser", foreign_keys=[reviewed_by_id])

    def to_dict(self) -> dict:
        return {
            "id":             self.id,
            "user_id":        self.user_id,
            "user_email":     self.user.email if self.user else None,
            "user_name":      self.user.name  if self.user else None,
            "requested_tier": self.requested_tier,
            "motivation":     self.motivation,
            "status":         self.status,
            "reviewed_by_id": self.reviewed_by_id,
            "reviewed_at":    self.reviewed_at.isoformat() if self.reviewed_at else None,
            "admin_note":     self.admin_note,
            "created_at":     self.created_at.isoformat() if self.created_at else None,
        }
