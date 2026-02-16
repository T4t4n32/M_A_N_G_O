from .health import health_bp
from .data import api_bp

def register_routes(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(api_bp, url_prefix="/api/v1")
