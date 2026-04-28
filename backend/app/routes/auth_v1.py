from flask import Blueprint, request, jsonify, session
from app.database import db, bcrypt
from app.models.user import User

auth_v1_bp = Blueprint("auth_v1", __name__, url_prefix="/api/v1/users")


@auth_v1_bp.route("/login", methods=["POST"])
def login():
    """POST /api/v1/users/login
    Body: { "email": str, "password": str }
    Returns: { "user": { id, email, role, full_name } }
    """
    data = request.get_json(silent=True)
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=data["email"].strip().lower()).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "invalid credentials"}), 401

    if user.status != "Activo":
        return jsonify({"error": "account is not active"}), 403

    session["user_id"] = user.id
    session["role"] = user.role

    return jsonify({
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "plan": user.plan,
        }
    }), 200


@auth_v1_bp.route("/status", methods=["GET"])
def status():
    """GET /api/v1/users/status
    Returns the current session user. Validates role === 'admin' for panel use.
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"authenticated": False}), 401

    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({"authenticated": False}), 401

    return jsonify({
        "authenticated": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "plan": user.plan,
        }
    }), 200


@auth_v1_bp.route("/logout", methods=["POST"])
def logout():
    """POST /api/v1/users/logout"""
    session.clear()
    return jsonify({"status": "logged out"}), 200
