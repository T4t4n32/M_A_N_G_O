"""Liveness probe for the edge Flask app."""

from datetime import datetime, timezone

from flask import Blueprint, jsonify

health_bp = Blueprint("edge_health", __name__)


@health_bp.route("/health")
def health():
    return jsonify({"ok": True, "ts": datetime.now(timezone.utc).isoformat()}), 200
