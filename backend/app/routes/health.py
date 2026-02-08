# backend/app/routes/health.py
from datetime import datetime, timezone

from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db, redis_client

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    db_ok = False
    redis_ok = False

    try:
        db.session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    try:
        if redis_client is None:
            redis_ok = True  # si no usas redis aún, no bloquea el sistema
        else:
            redis_ok = (redis_client.ping() is True)
    except Exception:
        redis_ok = False

    status = "ok" if (db_ok and redis_ok) else "degraded"

    return jsonify(
        status=status,
        db=("ok" if db_ok else "fail"),
        redis=("ok" if redis_ok else "fail"),
        time=datetime.now(timezone.utc).isoformat(),
    ), (200 if status == "ok" else 200)
