import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from app.config import Config
from app.database import init_db
from app.api import register_routes


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS — frontend must send credentials: "include".
    # CHANGE_BEFORE_PRODUCTION: FRONTEND_ORIGIN must be the exact production domain.
    CORS(app, supports_credentials=True, origins=[app.config["FRONTEND_ORIGIN"]])

    # Database + ORM
    init_db(app)

    # Routes
    register_routes(app)

    # Serve uploaded files statically under /uploads/...
    @app.route("/uploads/media/<path:filename>")
    def serve_media(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER_MEDIA"], filename)

    @app.route("/uploads/docs/<path:filename>")
    def serve_docs(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER_DOCS"], filename)

    return app
