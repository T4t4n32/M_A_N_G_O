from functools import wraps

from flask import jsonify, session

from app.extensions import db
from app.models.user import MangoUser


def _current_user() -> MangoUser | None:
    uid = session.get("user_id")
    if not uid:
        return None
    return db.session.get(MangoUser, uid)


def admin_required(f):
    """Decorator: requires an active session with role == 'admin'."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = _current_user()
        if not user or not user.active:
            return jsonify({"error": "authentication required"}), 401
        if user.role != "admin":
            return jsonify({"error": "forbidden — admin role required"}), 403
        return f(*args, **kwargs)
    return decorated


def login_required(f):
    """Decorator: requires an active session (any role)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = _current_user()
        if not user or not user.active:
            return jsonify({"error": "authentication required"}), 401
        return f(*args, **kwargs)
    return decorated
