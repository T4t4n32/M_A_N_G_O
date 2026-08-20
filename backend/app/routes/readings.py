"""
Readings and sensor-status API — protocol-aligned endpoints.

GET /api/v1/readings/latest          — latest value per sensor type (ph/temperature/turbidity)
GET /api/v1/readings/history         — time-series for one sensor type
GET /api/v1/readings/export          — CSV download of time-series data
GET /api/v1/sensors/status           — connection + freshness status for each sensor
"""

from __future__ import annotations

import csv
import io
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from flask import Blueprint, Response, jsonify, request
from sqlalchemy import text

from app.extensions import db
from app.middleware.admin_required import login_required

readings_bp = Blueprint("readings", __name__, url_prefix="/api/v1")
log = logging.getLogger("mango.readings")

SENSOR_TYPES = ("ph", "temperature", "turbidity")

# Alias for how temperature is stored in the legacy compat table
_INTERNAL_ALIAS = {"temperature": "temp"}
_DISPLAY_ALIAS = {"temp": "temperature"}

# Thresholds for status computation
_THRESHOLDS = {
    "ph": {"optimal": (6.5, 8.5), "warning": (5.5, 9.5), "critical": (4.0, 10.5)},
    "temperature": {"optimal": (15.0, 30.0), "warning": (10.0, 35.0), "critical": (5.0, 40.0)},
    "turbidity": {"optimal": (0.0, 5.0), "warning": (0.0, 10.0), "critical": (0.0, 50.0)},
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _ts_iso(v: Any) -> str | None:
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return str(v)


def _get_readings_table() -> str | None:
    from sqlalchemy import inspect as sa_inspect
    try:
        names = set(sa_inspect(db.engine).get_table_names())
    except Exception:
        return None
    for candidate in ("mango_compat_readings", "readings"):
        if candidate in names:
            return candidate
    return None


def _compute_value_status(sensor_type: str, value: float) -> str:
    thresh = _THRESHOLDS.get(sensor_type)
    if not thresh:
        return "unknown"
    lo_c, hi_c = thresh["critical"]
    lo_w, hi_w = thresh["warning"]
    lo_o, hi_o = thresh["optimal"]
    if value < lo_c or value > hi_c:
        return "critical"
    if value < lo_w or value > hi_w:
        return "warning"
    if lo_o <= value <= hi_o:
        return "optimal"
    return "normal"


def _staleness_status(ts: datetime) -> str:
    age = (_utcnow() - ts).total_seconds()
    if age < 300:
        return "online"
    if age < 3600:
        return "stale"
    return "offline"


@readings_bp.get("/readings/latest")
@login_required
def readings_latest():
    """Return the latest value for each of the three core sensors."""
    table = _get_readings_table()
    if not table:
        return jsonify({
            "status": "no_data",
            "message": "No readings table found. Waiting for device connection.",
            "sensors": {t: None for t in SENSOR_TYPES},
        }), 200

    now = _utcnow()
    scan = 1000
    try:
        rows = db.session.execute(
            text(f"SELECT ts, type, value, unit FROM {table} ORDER BY ts DESC LIMIT :scan"),
            {"scan": scan},
        ).mappings().all()
    except Exception:
        log.exception("Failed to query latest readings")
        return jsonify({"error": "query_failed", "detail": "database query failed"}), 500

    latest: Dict[str, Any] = {}
    for r in rows:
        t = str(r.get("type") or "")
        display_t = _DISPLAY_ALIAS.get(t, t)
        if display_t in SENSOR_TYPES and display_t not in latest:
            latest[display_t] = {
                "value": float(r["value"]) if r.get("value") is not None else None,
                "unit": r.get("unit") or "",
                "timestamp": _ts_iso(r.get("ts")),
                "status": "unknown",
                "value_status": "unknown",
            }

    sensors: Dict[str, Any] = {}
    for sensor in SENSOR_TYPES:
        entry = latest.get(sensor)
        if entry is None:
            sensors[sensor] = {
                "value": None,
                "unit": "",
                "timestamp": None,
                "status": "no_data",
                "value_status": "unknown",
            }
        else:
            ts = None
            if entry["timestamp"]:
                try:
                    ts = datetime.fromisoformat(entry["timestamp"].replace("Z", "+00:00"))
                    if ts.tzinfo is None:
                        ts = ts.replace(tzinfo=timezone.utc)
                except Exception:
                    pass
            conn_status = _staleness_status(ts) if ts else "no_data"
            val_status = (
                _compute_value_status(sensor, entry["value"])
                if entry["value"] is not None else "unknown"
            )
            sensors[sensor] = {
                **entry,
                "status": conn_status,
                "value_status": val_status,
            }

    any_online = any(s["status"] == "online" for s in sensors.values())
    system_status = "online" if any_online else "offline"

    return jsonify({
        "status": system_status,
        "server_time": now.isoformat(),
        "sensors": sensors,
    }), 200


@readings_bp.get("/readings/history")
@login_required
def readings_history():
    """Return a time-series for one sensor type."""
    sensor_type = (request.args.get("type") or "").strip().lower()
    if sensor_type not in SENSOR_TYPES:
        return jsonify({
            "error": "invalid_type",
            "message": f"type must be one of: {', '.join(SENSOR_TYPES)}",
        }), 400

    internal_type = _INTERNAL_ALIAS.get(sensor_type, sensor_type)

    try:
        minutes = max(1, min(int(request.args.get("minutes", 60)), 60 * 24 * 180))
    except (TypeError, ValueError):
        minutes = 60
    try:
        limit = max(10, min(int(request.args.get("limit", 360)), 5000))
    except (TypeError, ValueError):
        limit = 360

    table = _get_readings_table()
    if not table:
        return jsonify({"type": sensor_type, "series": [], "count": 0,
                        "message": "No data available yet."}), 200

    start_ts = _utcnow() - timedelta(minutes=minutes)
    try:
        rows = db.session.execute(
            text(
                f"""
                SELECT ts, value, unit
                FROM {table}
                WHERE type = :type AND ts >= :start
                ORDER BY ts ASC
                LIMIT :limit
                """
            ),
            {"type": internal_type, "start": start_ts, "limit": limit},
        ).mappings().all()
    except Exception:
        log.exception("Failed to query reading history")
        return jsonify({"error": "query_failed", "detail": "database query failed"}), 500

    series = [
        {"ts": _ts_iso(r["ts"]), "value": float(r["value"]) if r.get("value") is not None else None}
        for r in rows
    ]

    return jsonify({
        "type": sensor_type,
        "minutes": minutes,
        "count": len(series),
        "series": series,
    }), 200


@readings_bp.get("/readings/export")
@login_required
def readings_export():
    """Download a CSV of readings for a sensor type."""
    sensor_type = (request.args.get("type") or "").strip().lower()
    if sensor_type not in SENSOR_TYPES:
        return jsonify({
            "error": "invalid_type",
            "message": f"type must be one of: {', '.join(SENSOR_TYPES)}",
        }), 400

    internal_type = _INTERNAL_ALIAS.get(sensor_type, sensor_type)

    try:
        hours = max(1, min(int(request.args.get("hours", 24)), 24 * 30))
    except (TypeError, ValueError):
        hours = 24

    table = _get_readings_table()
    if not table:
        return Response("ts,value,unit\n", mimetype="text/csv",
                        headers={"Content-Disposition": f"attachment; filename=mango_{sensor_type}.csv"})

    start_ts = _utcnow() - timedelta(hours=hours)
    try:
        rows = db.session.execute(
            text(
                f"""
                SELECT ts, value, unit
                FROM {table}
                WHERE type = :type AND ts >= :start
                ORDER BY ts ASC
                LIMIT 10000
                """
            ),
            {"type": internal_type, "start": start_ts},
        ).mappings().all()
    except Exception:
        rows = []

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["timestamp_utc", sensor_type, "unit"])
    for r in rows:
        writer.writerow([
            _ts_iso(r.get("ts")),
            r.get("value"),
            r.get("unit") or "",
        ])

    filename = f"mango_{sensor_type}_{_utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@readings_bp.get("/sensors/status")
@login_required
def sensors_status():
    """Return connection + freshness status for each of the three sensors."""
    table = _get_readings_table()
    now = _utcnow()

    if not table:
        return jsonify({
            "system_status": "no_data",
            "message": "No readings table found. Waiting for device connection.",
            "server_time": now.isoformat(),
            "sensors": {t: {"status": "no_data", "value": None, "timestamp": None} for t in SENSOR_TYPES},
        }), 200

    scan = 500
    try:
        rows = db.session.execute(
            text(f"SELECT ts, type, value, unit FROM {table} ORDER BY ts DESC LIMIT :scan"),
            {"scan": scan},
        ).mappings().all()
    except Exception:
        log.exception("Failed to query sensor status")
        return jsonify({"error": "query_failed", "detail": "database query failed"}), 500

    latest: Dict[str, Any] = {}
    for r in rows:
        t = str(r.get("type") or "")
        display_t = _DISPLAY_ALIAS.get(t, t)
        if display_t in SENSOR_TYPES and display_t not in latest:
            latest[display_t] = {
                "value": float(r["value"]) if r.get("value") is not None else None,
                "unit": r.get("unit") or "",
                "ts": r.get("ts"),
            }

    sensors = {}
    for sensor in SENSOR_TYPES:
        entry = latest.get(sensor)
        if not entry:
            sensors[sensor] = {"status": "no_data", "value": None, "timestamp": None, "unit": ""}
            continue
        ts = entry["ts"]
        if ts and not hasattr(ts, "tzinfo"):
            try:
                ts = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
            except Exception:
                ts = None
        if ts and hasattr(ts, "tzinfo") and ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        conn_status = _staleness_status(ts) if ts else "no_data"
        val_status = _compute_value_status(sensor, entry["value"]) if entry["value"] is not None else "unknown"
        sensors[sensor] = {
            "status": conn_status,
            "value_status": val_status,
            "value": entry["value"],
            "unit": entry["unit"],
            "timestamp": _ts_iso(ts),
        }

    any_online = any(s["status"] == "online" for s in sensors.values())
    any_offline = any(s["status"] in ("offline", "no_data") for s in sensors.values())
    if any_online:
        system_status = "online"
    elif any_offline:
        system_status = "offline"
    else:
        system_status = "stale"

    return jsonify({
        "system_status": system_status,
        "server_time": now.isoformat(),
        "sensors": sensors,
    }), 200
