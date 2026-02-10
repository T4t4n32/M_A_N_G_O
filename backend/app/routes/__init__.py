from flask import Flask
from app.routes.health import health_bp
from app.routes.data import api_bp

def register_routes(app: Flask) -> None:
    app.register_blueprint(health_bp)
    app.register_blueprint(api_bp, url_prefix="/api/v1")
