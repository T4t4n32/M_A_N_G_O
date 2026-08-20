"""
Decoradores de control de acceso por rango.

Uso:
    from app.utils.tier_auth import require_tier

    @bp.get("/reports")
    @require_tier("dataline_low")
    def reports():
        ...
"""

from __future__ import annotations

from functools import wraps

from flask import jsonify

from app.models.subscription import TIER_ORDER, tier_for_user
from app.utils.auth import current_user


def require_tier(min_tier: str):
    """Allow access only to users whose effective tier >= min_tier."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user or not user.active:
                return jsonify({"error": "unauthorized", "message": "Sesión requerida"}), 401
            effective = tier_for_user(user)
            if TIER_ORDER.get(effective, 0) < TIER_ORDER.get(min_tier, 0):
                return jsonify({
                    "error":         "forbidden",
                    "required_tier": min_tier,
                    "your_tier":     effective,
                    "message":       f"Se requiere rango '{min_tier}' o superior",
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
