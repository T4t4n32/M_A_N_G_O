from datetime import datetime, timezone
from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db

# Health "oficial" para API
health_bp = Blueprint("health", __name__, url_prefix="/api/v1")

@health_bp.get("/health")
def api_health():
    db_ok = True
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    # Si la DB está bien -> 200
    # Si la DB falla -> 503 (healthcheck fallará y es correcto)
    status = 200 if db_ok else 503

    return jsonify({
        "status": "ok" if db_ok else "degraded",
        "db": "ok" if db_ok else "fail",
        "time": datetime.now(timezone.utc).isoformat()
    }), status


# Health legacy (por si tienes cosas viejas pegándole a /health)
legacy_health_bp = Blueprint("legacy_health", __name__)

@legacy_health_bp.get("/health")
def legacy_health():
    return api_health()