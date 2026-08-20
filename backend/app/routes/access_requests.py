"""
Solicitudes de acceso / upgrade de tier.

Endpoints (url_prefix=/api/v1/access-requests):
  POST   /                  — usuario envía solicitud (autenticado)
  GET    /mine              — usuario ve sus propias solicitudes
  GET    /                  — admin lista todas las solicitudes
  PATCH  /<id>/approve      — admin aprueba → crea UserSubscription
  PATCH  /<id>/reject       — admin rechaza + nota opcional
"""
from __future__ import annotations

from datetime import datetime, timezone
from functools import wraps

from flask import Blueprint, jsonify, request, session

from app.extensions import db
from app.models.access_request import MangoAccessRequest
from app.models.subscription import VALID_TIERS, UserSubscription, default_expires_at, tier_for_user
from app.models.user import MangoUser

access_requests_bp = Blueprint("access_requests", __name__, url_prefix="/api/v1/access-requests")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _current_user() -> MangoUser | None:
    uid = session.get("user_id")
    return db.session.get(MangoUser, uid) if uid else None


def _require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _current_user()
        if not user or not user.active:
            return jsonify({"error": "unauthorized"}), 401
        return fn(*args, **kwargs)
    return wrapper


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


# ------------------------------------------------------------------
# POST / — usuario envía solicitud
# ------------------------------------------------------------------

@access_requests_bp.post("/", strict_slashes=False)
@_require_auth
def submit_request():
    user = _current_user()
    data = request.get_json(silent=True) or {}

    requested_tier = (data.get("requested_tier") or "").strip()
    motivation     = (data.get("motivation") or "").strip() or None

    if requested_tier not in VALID_TIERS:
        return jsonify({"error": f"tier inválido. Válidos: {', '.join(VALID_TIERS)}"}), 400

    # Prevent duplicate pending requests for the same tier
    existing = (
        MangoAccessRequest.query
        .filter_by(user_id=user.id, requested_tier=requested_tier, status="pending")
        .first()
    )
    if existing:
        return jsonify({
            "error": "Ya tienes una solicitud pendiente para ese plan",
            "request": existing.to_dict(),
        }), 409

    req = MangoAccessRequest(
        user_id=user.id,
        requested_tier=requested_tier,
        motivation=motivation,
        status="pending",
    )
    db.session.add(req)
    db.session.commit()

    return jsonify({"ok": True, "request": req.to_dict()}), 201


# ------------------------------------------------------------------
# GET /mine — usuario ve sus propias solicitudes
# ------------------------------------------------------------------

@access_requests_bp.get("/mine")
@_require_auth
def my_requests():
    user = _current_user()
    reqs = (
        MangoAccessRequest.query
        .filter_by(user_id=user.id)
        .order_by(MangoAccessRequest.created_at.desc())
        .limit(20)
        .all()
    )
    return jsonify({"requests": [r.to_dict() for r in reqs]}), 200


# ------------------------------------------------------------------
# GET / — admin lista solicitudes (filtrable por status)
# ------------------------------------------------------------------

@access_requests_bp.get("/", strict_slashes=False)
@_require_admin
def list_requests():
    status = request.args.get("status")  # pending | approved | rejected
    limit  = min(int(request.args.get("limit", 100)), 500)

    q = MangoAccessRequest.query
    if status:
        q = q.filter_by(status=status)

    reqs = q.order_by(MangoAccessRequest.created_at.desc()).limit(limit).all()
    return jsonify({"requests": [r.to_dict() for r in reqs]}), 200


# ------------------------------------------------------------------
# PATCH /<id>/approve — admin aprueba
# ------------------------------------------------------------------

@access_requests_bp.patch("/<int:req_id>/approve")
@_require_admin
def approve_request(req_id: int):
    admin = _current_user()
    req   = db.get_or_404(MangoAccessRequest, req_id)

    if req.status != "pending":
        return jsonify({"error": f"La solicitud ya está en estado '{req.status}'"}), 409

    data       = request.get_json(silent=True) or {}
    admin_note = (data.get("admin_note") or "").strip() or None
    expires_at_raw = data.get("expires_at")

    # Resolve expiry: explicit override > tier default
    if expires_at_raw:
        try:
            expires_at = datetime.fromisoformat(str(expires_at_raw).replace("Z", "+00:00"))
        except (TypeError, ValueError):
            return jsonify({"error": "expires_at inválido (se espera ISO-8601)"}), 400
    else:
        expires_at = default_expires_at(req.requested_tier)

    # Grant subscription
    sub = UserSubscription(
        user_id=req.user_id,
        tier=req.requested_tier,
        granted_by_id=admin.id,
        expires_at=expires_at,
        notes=f"Aprobado vía solicitud #{req.id}" + (f" — {admin_note}" if admin_note else ""),
    )
    db.session.add(sub)

    # Mark request as approved
    req.status        = "approved"
    req.reviewed_by_id = admin.id
    req.reviewed_at   = _utcnow()
    req.admin_note    = admin_note
    db.session.commit()

    return jsonify({
        "ok":           True,
        "request":      req.to_dict(),
        "subscription": sub.to_dict(),
        "user_tier":    tier_for_user(req.user),
    }), 200


# ------------------------------------------------------------------
# PATCH /<id>/reject — admin rechaza
# ------------------------------------------------------------------

@access_requests_bp.patch("/<int:req_id>/reject")
@_require_admin
def reject_request(req_id: int):
    admin = _current_user()
    req   = db.get_or_404(MangoAccessRequest, req_id)

    if req.status != "pending":
        return jsonify({"error": f"La solicitud ya está en estado '{req.status}'"}), 409

    data       = request.get_json(silent=True) or {}
    admin_note = (data.get("admin_note") or "").strip() or None

    req.status         = "rejected"
    req.reviewed_by_id = admin.id
    req.reviewed_at    = _utcnow()
    req.admin_note     = admin_note
    db.session.commit()

    return jsonify({"ok": True, "request": req.to_dict()}), 200
