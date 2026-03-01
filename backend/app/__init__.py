"""
Flask application factory.

This is the REAL place where the Flask app is created.
"""

from __future__ import annotations

from flask import Flask

from .config import Config
from .extensions import db, init_redis
from .routes import register_routes


# -----------------------------------------------------------------------------
# NOTE (ADD-ONLY SAFETY):
# Your previous file had: `from edge import app`
# That can cause import loops or override the `app` variable used in create_app().
# We keep the idea as an optional import, but we do NOT overwrite `app`.
# -----------------------------------------------------------------------------
try:
    from edge import app as _edge_app  # noqa: F401
except Exception:
    _edge_app = None


def _register_optional_blueprints(app: Flask) -> None:
    """
    Registers extra blueprints without breaking the whole app if a module is missing.
    (Additive and safe for production/dev.)
    """
    # Lovable auth endpoints (adds /api/v1/auth/*)
    try:
        from .routes.lovable_auth import auth_bp  # type: ignore
        app.register_blueprint(auth_bp)
    except Exception as e:
        # Do NOT crash if the file is not present yet
        app.logger.warning("Lovable auth blueprint not loaded: %s", e)

    # Lovable compatibility endpoints (adds Lovable-friendly shapes)
    try:
        from .routes.lovable_compat import compat_bp  # type: ignore
        app.register_blueprint(compat_bp)
    except Exception as e:
        app.logger.warning("Lovable compat blueprint not loaded: %s", e)


def create_app() -> Flask:
    app = Flask(__name__)

    # Load configuration (SECRET_KEY, DATABASE_URL, REDIS_URL, etc.)
    app.config.from_object(Config())

    # Init extensions first
    db.init_app(app)
    init_redis(app)  # sets redis_client (or None)

    # Register existing routes (your current API)
    register_routes(app)

    # Register Lovable compatibility routes (ADD-ONLY)
    _register_optional_blueprints(app)

    return app