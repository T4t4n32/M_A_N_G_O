from app.routes.health import health_bp
from app.routes.sensors import sensors_bp
from app.routes.auth_v1 import auth_v1_bp
from app.routes.admin_media import admin_media_bp
from app.routes.admin_docs import admin_docs_bp
from app.routes.admin_content import admin_content_bp


def register_routes(app):
    """Register all blueprints with the Flask app."""
    app.register_blueprint(health_bp)
    app.register_blueprint(sensors_bp)
    app.register_blueprint(auth_v1_bp)
    app.register_blueprint(admin_media_bp)
    app.register_blueprint(admin_docs_bp)
    app.register_blueprint(admin_content_bp)
