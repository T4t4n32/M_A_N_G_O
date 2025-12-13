from .routes.auth import auth_bp
from .routes.health import health_bp
from .routes.sensors import sensors_bp
from .routes.stream import stream_bp

from .routes.temperature import temperature_bp
from .routes.ph import ph_bp
from .routes.turbidity import turbidity_bp


def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(sensors_bp, url_prefix="/api")
    app.register_blueprint(stream_bp, url_prefix="/api")

    app.register_blueprint(temperature_bp, url_prefix="/api")
    app.register_blueprint(ph_bp, url_prefix="/api")
    app.register_blueprint(turbidity_bp, url_prefix="/api")
