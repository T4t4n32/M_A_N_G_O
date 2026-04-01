from __future__ import annotations

import os
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

# Blueprint mounted at /api/v1
auth_bp = Blueprint("lovable_auth", __name__)

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _get_admin_credentials():
    email = os.getenv("ADMIN_EMAIL", "").strip()
    pw_hash = os.getenv("ADMIN_PASSWORD_HASH", "").strip()
    pw_plain = os.getenv("ADMIN_PASSWORD", "").strip()  # optional (not recommended)
    return email, pw_hash, pw_plain

def _auth_disabled() -> bool:
    return os.getenv("AUTH_DISABLED", "0").lower() in ("1", "true", "yes")

@auth_bp.get("/api/v1/auth/status")
def auth_status():
    # If auth is disabled (dev/demo), always authenticated
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
        return jsonify({"success": True, "user": {"email": "demo@mango.local", "name": "Demo"}}), 200

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "")

    admin_email, admin_hash, admin_plain = _get_admin_credentials()

    if not admin_email:
        return jsonify({"error": "Auth not configured", "message": "ADMIN_EMAIL missing"}), 500

    ok = False
    if email == admin_email:
        if admin_hash:
            ok = check_password_hash(admin_hash, password)
        elif admin_plain:
            ok = (password == admin_plain)

    if not ok:
        return jsonify({"error": "Unauthorized", "message": "Invalid credentials"}), 401

    session["user"] = email
    return jsonify({"success": True, "user": {"email": email, "name": email.split("@")[0]}}), 200

@auth_bp.post("/api/v1/auth/logout")
def auth_logout():
    session.pop("user", None)
    return jsonify({"success": True}), 200

# Helper (optional): generate a hash for ADMIN_PASSWORD_HASH
# Run locally:
# python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('YOUR_PASSWORD'))"
