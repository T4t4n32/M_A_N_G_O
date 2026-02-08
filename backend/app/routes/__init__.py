# backend/app/routes/__init__.py
from app.routes.health import bp as health_bp
from app.routes.data import api as api_bp


def register_routes(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(api_bp)
