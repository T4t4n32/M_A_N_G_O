"""
Primitivas compartidas de autenticación por sesión.

Single source of truth for "who is the caller" and for the session guards used
by the API blueprints. The error payloads are parameters because each blueprint
already exposes its own wording; the factories keep those responses byte-for-byte
identical while sharing the logic.

Uso:
    from app.utils.auth import current_user, require_admin, require_auth

    _require_admin = require_admin(auth_error="unauthorized",
                                   forbidden_message="Solo administradores")

    @bp.post("/")
    @_require_admin
    def create():
        user = current_user()
        ...
"""

from __future__ import annotations

from functools import wraps
from typing import Callable

from flask import jsonify, session

from app.extensions import db
from app.models.user import MangoUser

AuthCheck = Callable[[MangoUser], bool]


def current_user() -> MangoUser | None:
    """The user behind the current session, or None when unauthenticated."""
    uid = session.get("user_id")
    return db.session.get(MangoUser, uid) if uid else None


def is_admin(user: MangoUser) -> bool:
    return user.role == "admin"


def find_user_by_identifier(identifier: str) -> MangoUser | None:
    """Look up a user by username OR email (case-insensitive)."""
    ident = identifier.strip().lower()
    return MangoUser.query.filter(
        db.or_(
            db.func.lower(MangoUser.email)    == ident,
            db.func.lower(MangoUser.username) == ident,
        )
    ).first()


def _error(error: str, message: str | None, status: int):
    body: dict[str, str] = {"error": error}
    if message:
        body["message"] = message
    return jsonify(body), status


def require_session(
    *,
    check: AuthCheck | None = None,
    auth_error: str = "authentication required",
    auth_message: str | None = None,
    forbidden_error: str = "forbidden",
    forbidden_message: str | None = None,
    forbidden_body: dict | None = None,
):
    """Build a decorator that requires an active session, optionally satisfying `check`.

    Responds 401 when there is no active user and 403 when `check` rejects it.
    `forbidden_body` replaces the 403 payload entirely when given.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user or not user.active:
                return _error(auth_error, auth_message, 401)
            if check and not check(user):
                if forbidden_body is not None:
                    return jsonify(forbidden_body), 403
                return _error(forbidden_error, forbidden_message, 403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_auth(*, error: str = "authentication required", message: str | None = None):
    """Decorator factory: active session required, any role."""
    return require_session(auth_error=error, auth_message=message)


def require_admin(
    *,
    auth_error: str = "authentication required",
    auth_message: str | None = None,
    forbidden_error: str = "forbidden",
    forbidden_message: str | None = None,
):
    """Decorator factory: active session with role == 'admin' required."""
    return require_session(
        check=is_admin,
        auth_error=auth_error,
        auth_message=auth_message,
        forbidden_error=forbidden_error,
        forbidden_message=forbidden_message,
    )
