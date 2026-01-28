# backend/app/routes/__init__.py
from .auth import auth_bp
from .health import health_bp

def register_blueprints(app):
    """Registrar todos los blueprints de la aplicación"""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(health_bp, url_prefix='/api')