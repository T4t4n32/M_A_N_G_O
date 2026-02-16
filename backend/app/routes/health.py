from flask import Blueprint, jsonify
from sqlalchemy import text
from app.extensions import db
from app.extensions import redis_client
from datetime import datetime, timezone

health_bp = Blueprint("health", __name__)

@health_bp.get("/health")
def health():
    # DB check
    try:
        db.session.execute(text("SELECT 1"))
        db_ok = "ok"
    except Exception:
        db_ok = "fail"

    # Redis check
    try:
        redis_client.ping()
        redis_ok = "ok"
    except Exception:
        redis_ok = "fail"

    status = "ok" if (db_ok == "ok" and redis_ok == "ok") else "degraded"

    return jsonify({
        "status": status,
        "db": db_ok,
        "redis": redis_ok,
        "time": datetime.now(timezone.utc).isoformat(),
    }), (200 if status == "ok" else 503)
