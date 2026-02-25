"""Minimal health endpoints (additive).

- Provides GET /api/v1/health
- Also provides GET /health (legacy)

If your project already defines these routes elsewhere, registration may collide.
In that case, the registrar will skip this blueprint and keep the existing one.
"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db

health_compat_bp = Blueprint("health_compat", __name__, url_prefix="/api/v1")


@health_compat_bp.get("/health")
def health():
    db_ok = True
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    status = 200 if db_ok else 503
    return jsonify(
        {
            "status": "ok" if db_ok else "degraded",
            "db": "ok" if db_ok else "fail",
            "time": datetime.now(timezone.utc).isoformat(),
        }
    ), status


legacy_health_compat_bp = Blueprint("legacy_health_compat", __name__)


@legacy_health_compat_bp.get("/health")
def legacy_health():
    return health()
