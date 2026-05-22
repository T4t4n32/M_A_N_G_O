"""M.A.N.G.O. edge Flask app factory."""

from __future__ import annotations

import os

from flask import Flask

from .db import init_db
from .routes.ingest import ingest_bp
from .routes.dashboard_api import dashboard_bp


def create_app(config: dict | None = None) -> Flask:
    app = Flask(__name__)

    app.config["MISSION_DIR"] = os.environ.get("MISSION_DIR", "/opt/mango/missions")
    app.config["DB_PATH"] = os.environ.get("DB_PATH", "/opt/mango/edge.db")

    if config:
        app.config.update(config)

    init_db(app.config["DB_PATH"])

    app.register_blueprint(ingest_bp)
    app.register_blueprint(dashboard_bp)

    return app
