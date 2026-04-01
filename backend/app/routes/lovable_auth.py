"""
GET  /api/v1/auth/status
POST /api/v1/auth/login
POST /api/v1/auth/logout

Usa Flask sessions (cookies). Compatible con Lovable UI.
AUTH_DISABLED=1 para modo demo sin credenciales.
"""

from __future__ import annotations

import hmac
import os
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash

auth_bp = Blueprint("lovable_auth", __name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _auth_disabled() -> bool:
    return os.getenv("AUTH_DISABLED", "0").lower() in ("1", "true", "yes")


def _check_credentials(email: str, password: str) -> bool:
    admin_email = os.getenv("ADMIN_EMAIL", "").strip()
    admin_hash  = os.getenv("ADMIN_PASSWORD_HASH", "").strip()
    admin_plain = os.getenv("ADMIN_PASSWORD", "").strip()

    if not admin_email or email != admin_email:
        return False
    if admin_hash:
        return check_password_hash(admin_hash, password)
    if admin_plain:
        return hmac.compare_digest(password.encode(), admin_plain.encode())
    return False


@auth_bp.get("/api/v1/auth/status")
def auth_status():
    if _auth_disabled():
        return jsonify({
            "authenticated": True,
            "user": {"email": "demo@mango.local", "name": "Demo"},
            "time": _now_iso(),
        }), 200

    user = session.get("user")
    if not user:
        return jsonify({"authenticated": False, "time": _now_iso()}), 200

    return jsonify({
        "authenticated": True,
        "user": {"email": user, "name": user.split("@")[0]},
        "time": _now_iso(),
    }), 200


@auth_bp.post("/api/v1/auth/login")
def auth_login():
    if _auth_disabled():
        session["user"] = "demo@mango.local"
        return jsonify({
            "success": True,
            "user": {"email": "demo@mango.local", "name": "Demo"},
        }), 200

    data     = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "missing_fields", "message": "email y password requeridos"}), 400

    if not os.getenv("ADMIN_EMAIL"):
        return jsonify({"error": "not_configured", "message": "ADMIN_EMAIL no configurado"}), 500

    if not _check_credentials(email, password):
        return jsonify({"error": "unauthorized", "message": "Credenciales inválidas"}), 401

    session["user"] = email
    return jsonify({
        "success": True,
        "user": {"email": email, "name": email.split("@")[0]},
    }), 200


@auth_bp.post("/api/v1/auth/logout")
def auth_logout():
    session.pop("user", None)
    return jsonify({"success": True}), 200