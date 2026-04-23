"""
Gestión de suscripciones / rangos de acceso (solo administradores).

Endpoints (url_prefix=/api/v1/subscriptions):
  GET    /                    — listar todas las suscripciones
  POST   /                    — otorgar suscripción a un usuario
  GET    /<id>                — detalle de suscripción
  DELETE /<id>                — revocar suscripción

Endpoint adicional en el blueprint de usuarios:
  GET    /api/v1/users/me/subscription — suscripción activa propia
  GET    /api/v1/users/<id>/subscription — suscripción de un usuario (admin)
  GET    /api/v1/users/<id>/subscriptions/history — historial (admin)

Rangos válidos (tier):
  dataline_low   — trimestral (90 días), reportes básicos
  dataline_high  — trimestral (90 días), reportes ampliados + datasets
  institutional  — sin vencimiento, acceso institucional completo
"""

from __future__ import annotations

from datetime import datetime, timezone
from functools import wraps

from flask import Blueprint, jsonify, request, session

from app.extensions import db
from app.models.subscription import (
    VALID_TIERS,
    UserSubscription,
    default_expires_at,
    tier_for_user,
)
from app.models.user import MangoUser

subscriptions_bp = Blueprint("subscriptions", __name__, url_prefix="/api/v1/subscriptions")


def _current_user() -> MangoUser | None:
    uid = session.get("user_id")
    return db.session.get(MangoUser, uid) if uid else None


def _require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _current_user()
        if not user or not user.active:
            return jsonify({"error": "unauthorized"}), 401
        if user.role != "admin":
            return jsonify({"error": "forbidden", "message": "Solo administradores"}), 403
        return fn(*args, **kwargs)
    return wrapper


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


# ------------------------------------------------------------------
# Listar suscripciones
# ------------------------------------------------------------------

@subscriptions_bp.get("/")
@_require_admin
def list_subscriptions():
    user_id = request.args.get("user_id")
    tier    = request.args.get("tier")
    active  = request.args.get("active")
    limit   = min(int(request.args.get("limit", 100)), 500)

    q = UserSubscription.query

    if user_id:
        try:
            q = q.filter_by(user_id=int(user_id))
        except ValueError:
            return jsonify({"error": "user_id inválido"}), 400

    if tier:
        q = q.filter_by(tier=tier)

    subscriptions = q.order_by(UserSubscription.granted_at.desc()).limit(limit).all()

    if active is not None:
        want_active = active.lower() in ("1", "true", "yes")
        subscriptions = [s for s in subscriptions if s.is_active() == want_active]

    return jsonify({"subscriptions": [s.to_dict() for s in subscriptions]}), 200


# ------------------------------------------------------------------
# Otorgar suscripción
# ------------------------------------------------------------------

@subscriptions_bp.post("/")
@_require_admin
def grant_subscription():
    admin = _current_user()
    data  = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    tier    = (data.get("tier") or "").strip()
    notes   = (data.get("notes") or "").strip() or None

    if not user_id:
        return jsonify({"error": "user_id es requerido"}), 400
    if tier not in VALID_TIERS:
        return jsonify({"error": f"tier inválido. Válidos: {', '.join(VALID_TIERS)}"}), 400

    target = db.session.get(MangoUser, int(user_id))
    if not target:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Expiry: use provided value, fall back to tier default
    raw_expires = data.get("expires_at")
    expires_at  = _parse_dt(raw_expires) if raw_expires else default_expires_at(tier)

    sub = UserSubscription(
        user_id=target.id,
        tier=tier,
        granted_by_id=admin.id,
        expires_at=expires_at,
        notes=notes,
    )
    db.session.add(sub)
    db.session.commit()

    return jsonify({
        "ok":           True,
        "subscription": sub.to_dict(),
        "user_tier":    tier_for_user(target),
    }), 201


# ------------------------------------------------------------------
# Detalle de una suscripción
# ------------------------------------------------------------------

@subscriptions_bp.get("/<int:sub_id>")
@_require_admin
def get_subscription(sub_id: int):
    sub = db.get_or_404(UserSubscription, sub_id)
    return jsonify(sub.to_dict()), 200


# ------------------------------------------------------------------
# Revocar suscripción
# ------------------------------------------------------------------

@subscriptions_bp.delete("/<int:sub_id>")
@_require_admin
def revoke_subscription(sub_id: int):
    admin = _current_user()
    sub   = db.get_or_404(UserSubscription, sub_id)

    if sub.revoked_at is not None:
        return jsonify({"error": "La suscripción ya fue revocada"}), 409

    sub.revoked_at    = datetime.now(timezone.utc)
    sub.revoked_by_id = admin.id
    db.session.commit()

    return jsonify({"ok": True, "subscription": sub.to_dict()}), 200
