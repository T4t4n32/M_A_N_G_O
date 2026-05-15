from app.routes.health import health_bp
from app.routes.sensors import sensors_bp
from app.routes.users import users_bp
from app.routes.stations import stations_mgmt_bp
from app.routes.subscriptions import subscriptions_bp
from app.routes.admin_media import admin_media_bp
from app.routes.admin_docs import admin_docs_bp
from app.routes.admin_content import admin_content_bp
from app.routes.alerts import alerts_bp


def register_routes(app):
    """Register all blueprints with the Flask app."""
    app.register_blueprint(health_bp)
    app.register_blueprint(sensors_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(stations_mgmt_bp)
    app.register_blueprint(subscriptions_bp)
    app.register_blueprint(admin_media_bp)
    app.register_blueprint(admin_docs_bp)
    app.register_blueprint(admin_content_bp)
    app.register_blueprint(alerts_bp)
