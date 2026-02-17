from app.routes import api_bp, health_bp


def register_blueprints(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(api_bp)
