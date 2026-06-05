from __future__ import annotations

from flask import Flask, jsonify
from flask_cors import CORS
from flask_sock import Sock

from .config import Config
from .extensions import db, init_redis
from .routes import register_routes

sock = Sock()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config())

    CORS(
        app,
        supports_credentials=True,
        origins=app.config["CORS_ORIGINS"],
    )

    db.init_app(app)
    init_redis(app)
    sock.init_app(app)
    register_routes(app)

    from .routes.admin_terminal_ws import vps_terminal_handler, jetson_terminal_handler

    @sock.route("/api/v1/admin/terminal/vps")
    def ws_vps(ws):
        vps_terminal_handler(ws)

    @sock.route("/api/v1/admin/terminal/jetson")
    def ws_jetson(ws):
        jetson_terminal_handler(ws)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "not_found", "message": str(e)}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "method_not_allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "internal_server_error"}), 500

    return app
