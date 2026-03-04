"""
Flask application factory.

This is the place where the Flask app is created.
"""

from __future__ import annotations

from flask import Flask

from .config import Config
from .extensions import db, init_redis
from .routes import register_routes


# Optional edge import (kept add-only and safe)
try:
    from edge import app as _edge_app  # noqa: F401
except Exception:
    _edge_app = None


def _register_optional_blueprints(app: Flask) -> None:
    """Register optional blueprints without crashing and without duplicates."""
    # Lovable auth is already registered by register_routes() when wrapper exists.
    # Keep this as a safety net for older setups, but skip if already present.
    try:
        from .routes.lovable_auth import auth_bp  # type: ignore
        if auth_bp.name not in app.blueprints:
            app.register_blueprint(auth_bp)
    except Exception:
        pass  # optional

    # We DO NOT register lovable_compat here (to avoid collisions).
    # Lovable compatibility is provided by dashboard_api.py (additive keys + alias support).


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config())

    db.init_app(app)
    init_redis(app)

    register_routes(app)
    _register_optional_blueprints(app)

    return app
