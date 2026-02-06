from flask import Flask
from .health import health_bp
from .data import api


def register_routes(app: Flask) -> None:
    app.register_blueprint(health_bp)
    app.register_blueprint(api, url_prefix="/api")
