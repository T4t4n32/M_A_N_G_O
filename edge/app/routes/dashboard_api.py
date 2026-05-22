"""Local status/dashboard API on the edge node (:9100).

GET /status                          — current mission state + last readings + connectivity
GET /missions                        — list local missions
GET /missions/<mission_id>/summary   — mission summary
GET /health                          — liveness check
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request

from app.db import get_db, get_current_mission, list_missions, get_mission

log = logging.getLogger("mango.edge.dashboard")

dashboard_bp = Blueprint("dashboard", __name__)


def _db_path() -> str:
    return current_app.config["DB_PATH"]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _last_sensor_readings(db_path: str, n: int = 3) -> list[dict]:
    """Return the most recent sensor readings from SQLite."""
    try:
        with get_db(db_path) as conn:
            rows = conn.execute(
                "SELECT type, value, unit, ts_local FROM sensor_readings"
                " ORDER BY id DESC LIMIT ?",
                (n,),
            ).fetchall()
        return [dict(r) for r in rows]
    except Exception as exc:
        log.warning("last_sensor_readings error: %s", exc)
        return []


def _check_vps_reachable() -> bool:
    """Lightweight connectivity check — just resolve the env var."""
    import urllib.request
    vps_url = os.environ.get("VPS_URL", "").rstrip("/")
    if not vps_url:
        return False
    try:
        req = urllib.request.Request(
            f"{vps_url}/api/v1/health",
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except Exception:
        return False


@dashboard_bp.get("/status")
def status():
    db_path = _db_path()
    mission = get_current_mission(db_path)
    last_readings = _last_sensor_readings(db_path)
    vps_online = _check_vps_reachable()

    device_id = os.environ.get("DEVICE_ID", "mango-field-unit-01")

    return jsonify({
        "device_id": device_id,
        "server_time": _now_iso(),
        "vps_reachable": vps_online,
        "current_mission": mission,
        "last_readings": last_readings,
        "battery": None,  # placeholder — wire to hardware when available
    }), 200


@dashboard_bp.get("/missions")
def list_missions_route():
    try:
        limit = max(1, min(200, int(request.args.get("limit", 50))))
    except (TypeError, ValueError):
        limit = 50

    missions = list_missions(_db_path(), limit=limit)
    return jsonify({"missions": missions, "count": len(missions)}), 200


@dashboard_bp.get("/missions/<string:mission_id>/summary")
def mission_summary(mission_id: str):
    mission = get_mission(_db_path(), mission_id)
    if not mission:
        return jsonify({"error": "mission not found"}), 404

    # Count readings
    try:
        with get_db(_db_path()) as conn:
            readings_count = conn.execute(
                "SELECT COUNT(*) FROM sensor_readings WHERE mission_id=?",
                (mission_id,),
            ).fetchone()[0]
            imu_count = conn.execute(
                "SELECT COUNT(*) FROM imu_readings WHERE mission_id=?",
                (mission_id,),
            ).fetchone()[0]
            pose_count = conn.execute(
                "SELECT COUNT(*) FROM pose_readings WHERE mission_id=?",
                (mission_id,),
            ).fetchone()[0]
    except Exception as exc:
        log.warning("count error: %s", exc)
        readings_count = imu_count = pose_count = 0

    return jsonify({
        "mission": mission,
        "stats": {
            "sensor_readings": readings_count,
            "imu_readings": imu_count,
            "pose_readings": pose_count,
        },
    }), 200


@dashboard_bp.get("/health")
def health():
    return jsonify({"ok": True, "ts": _now_iso()}), 200
