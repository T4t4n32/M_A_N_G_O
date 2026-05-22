"""Liveness probe for the edge Flask app."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify

health_bp = Blueprint("edge_health", __name__)


@health_bp.get("/health")
def health():
    return jsonify({"ok": True, "ts": datetime.now(timezone.utc).isoformat()}), 200
