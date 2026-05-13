from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db

health_bp = Blueprint("health", __name__, url_prefix="/api/v1")


@health_bp.get("/health")
def health():
    now = datetime.now(timezone.utc).isoformat()
    db_ok = False
    try:
        db.session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    status = "ok" if db_ok else "degraded"
    return jsonify({
        "status":    status,
        "db":        "ok" if db_ok else "error",
        "time":      now,
        "timestamp": now,
    }), 200 if db_ok else 503
