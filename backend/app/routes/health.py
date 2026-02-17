# backend/app/routes/health.py
from __future__ import annotations

from flask import Blueprint, jsonify
from app.extensions import db, redis_ok

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    db_ok = True
    try:
        db.session.execute(db.text("SELECT 1"))
    except Exception:
        db_ok = False

    return jsonify(
        {
            "status": "ok" if (db_ok and redis_ok()) else "degraded",
            "db": "ok" if db_ok else "fail",
            "redis": "ok" if redis_ok() else "fail",
        }
    )
