"""
Application factory and blueprint registration for the backend API.

This module exposes a ``create_app`` function which constructs and
configures the Flask application. It loads configuration, sets up
database and optional Redis extensions, and registers all API
blueprints. Downstream entrypoints such as ``main.py`` and
``wsgi.py`` import ``create_app`` from the top-level package via
``from app import create_app``.
"""

from __future__ import annotations

from flask import Flask

from .config import Config
from .extensions import db, init_redis
from .routes import bp


def create_app() -> Flask:
    """Application factory.

    Creates and configures a new Flask application instance.  This
    function follows the pattern recommended by the Flask
    documentation and is intended to be used by both development
    scripts (e.g., ``python main.py``) and production servers (e.g.,
    ``gunicorn app:create_app()``).

    Returns
    -------
    Flask
        The configured Flask application.
    """
    app = Flask(__name__)

    # Load configuration. Config can be subclassed or
    # parameterised via environment variables.
    app.config.from_object(Config())

    # Initialise extensions. SQLAlchemy is required for database
    # access; Redis is optional and will quietly fall back to a
    # no-op if the redis client cannot be initialised.
    db.init_app(app)
    try:
        init_redis(app)
    except Exception:
        # If Redis initialisation fails we simply continue without
        # raising; this makes the backend robust in environments
        # where Redis is unavailable or the `redis` library isn't
        # installed.
        pass

    # Register blueprints. All routes live on a single blueprint for
    # now. Additional blueprints can be added as the project grows.
    app.register_blueprint(bp)

    return app


__all__ = ["create_app"]