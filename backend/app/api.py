# app/api.py

from app.routes.health import health_bp
from app.routes.ph import ph_bp
from app.routes.temperature import temperature_bp
from app.routes.turbidity import turbidity_bp

def register_routes(app):
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(ph_bp, url_prefix="/api")
    app.register_blueprint(temperature_bp, url_prefix="/api")
    app.register_blueprint(turbidity_bp, url_prefix="/api")
