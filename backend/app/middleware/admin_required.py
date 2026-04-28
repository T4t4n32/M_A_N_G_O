from functools import wraps
from flask import session, jsonify
from app.models.user import User


def admin_required(f):
    """Decorator: verifies an active session with role == 'admin'.
    Returns 401 if not authenticated, 403 if authenticated but not admin.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "authentication required"}), 401

        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "forbidden — admin role required"}), 403

        return f(*args, **kwargs)

    return decorated


def login_required(f):
    """Decorator: verifies an active session (any role)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({"error": "authentication required"}), 401
        return f(*args, **kwargs)

    return decorated
