from __future__ import annotations

import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify
from sqlalchemy import text

from app.extensions import db

log = logging.getLogger("mango.health")

health_bp = Blueprint("health", __name__, url_prefix="/api/v1")

_VERSION = "2.0.0"
_PROJECT = "M.A.N.G.O."


@health_bp.get("/health")
def health():
    now = datetime.now(timezone.utc).isoformat()
    db_ok = False
    try:
        db.session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db.session.rollback()
        log.error("Health check: database probe failed", exc_info=True)

    status = "ok" if db_ok else "degraded"
    return jsonify({
        "status":    status,
        "db":        "ok" if db_ok else "error",
        "time":      now,
        "timestamp": now,
    }), 200 if db_ok else 503


@health_bp.get("/version")
def version():
    return jsonify({
        "project": _PROJECT,
        "version": _VERSION,
        "protocol": "HTTPS REST JSON",
        "api_prefix": "/api/v1",
    }), 200


@health_bp.get("/status")
def system_status():
    """Aggregate system status: DB, Redis, last reading, device count."""
    now = datetime.now(timezone.utc)

    db_ok = False
    try:
        db.session.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db.session.rollback()
        log.error("System status: database probe failed", exc_info=True)

    last_ts = None
    readings_count = 0
    device_count = 0
    system_state = "offline"

    if db_ok:
        try:
            row = db.session.execute(
                text("SELECT MAX(ts) AS last_ts, COUNT(*) AS cnt FROM mango_compat_readings")
            ).fetchone()
            if row:
                last_ts_raw = row[0]
                readings_count = int(row[1] or 0)
                if last_ts_raw:
                    if hasattr(last_ts_raw, "isoformat"):
                        last_ts = last_ts_raw
                    else:
                        try:
                            last_ts = datetime.fromisoformat(str(last_ts_raw).replace(" ", "T"))
                        except ValueError:
                            log.warning("Unparseable reading timestamp from DB: %r", last_ts_raw)
                    if last_ts:
                        if last_ts.tzinfo is None:
                            last_ts = last_ts.replace(tzinfo=timezone.utc)
                        age = (now - last_ts).total_seconds()
                        if age < 300:
                            system_state = "online"
                        elif age < 3600:
                            system_state = "stale"
                        else:
                            system_state = "offline"
        except Exception:
            db.session.rollback()
            log.error("System status: readings summary query failed", exc_info=True)

        try:
            device_count = db.session.execute(
                text("SELECT COUNT(*) FROM mango_devices")
            ).scalar() or 0
        except Exception:
            db.session.rollback()
            log.error("System status: device count query failed", exc_info=True)

    return jsonify({
        "status": system_state,
        "db": "ok" if db_ok else "error",
        "readings_total": readings_count,
        "devices_registered": device_count,
        "last_reading_ts": last_ts.isoformat() if last_ts else None,
        "server_time": now.isoformat(),
        "version": _VERSION,
    }), 200
