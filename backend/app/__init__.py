"""Flask application factory.

This is the REAL place where the Flask app is created.
"""

from flask import Flask

from .config import Config
from .extensions import db, init_redis
from .routes import register_routes


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config())

    db.init_app(app)
    init_redis(app)  # sets redis_client (or None)

    register_routes(app)
    return app
