from datetime import datetime, timezone

from flask import Blueprint, jsonify
from sqlalchemy import text
import redis as redis_lib

from app.extensions import db
from app.config import Config

health_bp = Blueprint("health", __name__)

@health_bp.get("/health")
def health():
    db_status = "ok"
    redis_status = "ok"

    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        db_status = "fail"

    try:
        r = redis_lib.from_url(Config.REDIS_URL)
        r.ping()
    except Exception:
        redis_status = "fail"

    status = "ok" if (db_status == "ok" and redis_status == "ok") else "degraded"

    return jsonify(
        status=status,
        db=db_status,
        redis=redis_status,
        time=datetime.now(timezone.utc).isoformat(),
    ), (200 if status == "ok" else 503)
