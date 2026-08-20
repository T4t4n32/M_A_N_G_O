from __future__ import annotations

import logging

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sock import Sock
from werkzeug.exceptions import HTTPException

from .config import Config
from .extensions import db, init_redis
from .logging_config import configure_logging
from .middleware.rate_limit_middleware import init_limiter
from .routes import register_routes

sock = Sock()

log = logging.getLogger("mango.app")


def create_app() -> Flask:
    configure_logging()

    app = Flask(__name__)
    app.config.from_object(Config())

    CORS(
        app,
        supports_credentials=True,
        origins=app.config["CORS_ORIGINS"],
    )

    db.init_app(app)
    init_redis(app)
    init_limiter(app)
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

    @app.errorhandler(HTTPException)
    def http_exception(e: HTTPException):
        return jsonify({
            "error": (e.name or "http_error").lower().replace(" ", "_"),
            "message": e.description,
        }), e.code or 500

    @app.errorhandler(Exception)
    def unhandled_exception(e: Exception):
        """Log the traceback and roll the session back before answering 500.

        Flask's default handler discards the exception detail and leaves the
        SQLAlchemy session in a failed state, so the next request on the same
        connection fails with InvalidRequestError instead of the real cause.
        """
        log.exception("Unhandled exception on %s %s", request.method, request.path)
        try:
            db.session.rollback()
        except Exception:
            log.exception("Session rollback failed after unhandled exception")
        return jsonify({
            "error": "internal_server_error",
            "message": "Error interno del servidor.",
        }), 500

    return app
