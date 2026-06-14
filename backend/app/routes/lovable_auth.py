"""
Auth alias endpoints — /api/v1/auth/status|login|logout

Thin wrappers kept for backward compatibility with any external integrations
that call /api/v1/auth/* instead of /api/v1/users/*.  All credential checking
delegates to the MangoUser database (same as users.py) — no env-based
plaintext passwords, no secondary credential store.
"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, session

from app.extensions import db
from app.middleware.rate_limit_middleware import limiter
from app.models.user import MangoLoginEvent, MangoUser

auth_bp = Blueprint("lovable_auth", __name__)

_LOGIN_ERROR = {"error": "unauthorized", "message": "Credenciales inválidas"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _find_user(identifier: str) -> MangoUser | None:
    ident = identifier.strip().lower()
    return MangoUser.query.filter(
        db.or_(
            db.func.lower(MangoUser.email)    == ident,
            db.func.lower(MangoUser.username) == ident,
        )
    ).first()


@auth_bp.get("/api/v1/auth/status")
def auth_status():
    uid = session.get("user_id")
    user = db.session.get(MangoUser, uid) if uid else None
    if not user or not user.active:
        return jsonify({"authenticated": False, "time": _now_iso()}), 200

    display_name = user.name or user.username or user.email.split("@")[0]
    return jsonify({
        "authenticated": True,
        "user": {"id": user.id, "email": user.email, "username": user.username, "name": display_name, "role": user.role},
        "time": _now_iso(),
    }), 200


@auth_bp.post("/api/v1/auth/login")
@limiter.limit("15 per minute;3 per second")
def auth_login():
    data       = request.get_json(silent=True) or {}
    identifier = (data.get("email") or data.get("username") or "").strip()
    password   = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"error": "missing_fields", "message": "usuario y password requeridos"}), 400

    user       = _find_user(identifier)
    password_ok = user.check_password(password) if user else False

    if not user or not password_ok or not user.active:
        if user and not password_ok:
            db.session.add(MangoLoginEvent(
                user_id=user.id,
                ip=request.remote_addr,
                user_agent=request.headers.get("User-Agent"),
                success=False,
            ))
            db.session.commit()
        return jsonify(_LOGIN_ERROR), 401

    user.record_login(ip=request.remote_addr, user_agent=request.headers.get("User-Agent"))
    db.session.commit()

    display_name = user.name or user.username or user.email.split("@")[0]
    session["user_id"] = user.id
    session["user"]    = user.email
    session["role"]    = user.role
    session.permanent  = True

    return jsonify({
        "success": True,
        "user": {"id": user.id, "email": user.email, "username": user.username, "name": display_name, "role": user.role},
    }), 200


@auth_bp.post("/api/v1/auth/logout")
def auth_logout():
    session.clear()
    return jsonify({"success": True}), 200
