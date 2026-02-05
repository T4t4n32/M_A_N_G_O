from app.routes.data import api

def register_routes(app):
    app.register_blueprint(api, url_prefix="/api")
