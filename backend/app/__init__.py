# backend/app/__init__.py
from __future__ import annotations

import os
from flask import Flask, jsonify

from app.extensions import db, init_redis
from app.routes.api import bp as api_bp
from app.routes.health import bp as health_bp


def create_app() -> Flask:
    app = Flask(__name__)

    # --- Config base (estable) ---
    app.config["JSON_SORT_KEYS"] = False

    db_url = os.getenv("DATABASE_URL", "postgresql+psycopg2://mango:mango@db:5432/mango")
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}

    app.config["REDIS_URL"] = os.getenv("REDIS_URL", "redis://redis:6379/0")
    app.config["MAX_LATEST_LIMIT"] = int(os.getenv("MAX_LATEST_LIMIT", "2000"))

    # --- Extensiones ---
    db.init_app(app)
    init_redis(app)

    # --- Rutas ---
    app.register_blueprint(health_bp)
    app.register_blueprint(api_bp)

    # --- Errores en JSON (para que el dashboard no “muera” por HTML) ---
    @app.errorhandler(404)
    def _404(_e):
        return jsonify({"ok": False, "error": "not_found"}), 404

    @app.errorhandler(500)
    def _500(_e):
        return jsonify({"ok": False, "error": "internal_error"}), 500

    return app
