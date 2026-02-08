from flask import Flask
from .config import Config
from .extensions import db, migrate, cors
from .celery_ext import celery_init_app
from .routes import register_routes
from app.services import serial_bridge


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # Extensions
    cors.init_app(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}})
    db.init_app(app)
    migrate.init_app(app, db)

    # Celery (stored in app.extensions["celery"])
    celery_init_app(app)

    # Routes
    register_routes(app)

    # Optional: auto-create + seed DB for prototype
    if app.config.get("AUTO_CREATE_DB", False):
        with app.app_context():
            db.create_all()

            if app.config.get("SEED_DB", False):
                from .models.sensor import Sensor

                defaults = [
                    dict(key="ph", name="pH", unit="pH", min_value=0.0, max_value=14.0, model="GENERIC_PH"),
                    dict(key="temperature", name="Temperature", unit="°C", min_value=-10.0, max_value=60.0, model="PT100_MAX31865"),
                    dict(key="turbidity", name="Turbidity", unit="NTU", min_value=0.0, max_value=5000.0, model="AZDM01"),
                ]
                for d in defaults:
                    if not Sensor.query.filter_by(key=d["key"]).first():
                        db.session.add(Sensor(**d))
                db.session.commit()

    serial_bridge.start_lora_listener(app)  # inicia el hilo de lectura LoRa

    return app
