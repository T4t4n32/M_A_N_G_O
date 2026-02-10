from flask import Flask
from app.config import Config
from app.extensions import db
from app.routes import register_routes

def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config())

    db.init_app(app)
    register_routes(app)

    # PROTOTIPO: crea tablas automáticamente (sin migraciones)
    with app.app_context():
        db.create_all()

    return app
