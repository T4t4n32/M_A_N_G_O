from __future__ import annotations

from flask import Flask, jsonify

from .config import Config
from .extensions import db, init_redis
from .routes import register_routes


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config())

    db.init_app(app)
    init_redis(app)
    register_routes(app)

    # Error handlers coherentes con el resto de la API
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

