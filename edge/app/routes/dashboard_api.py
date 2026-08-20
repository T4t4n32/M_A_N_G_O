"""Local status/dashboard API on the edge node (:9100).

GET /status                          — current mission state + last readings + connectivity
GET /missions                        — list local missions
GET /missions/<mission_id>/summary   — mission summary
GET /health                          — liveness check
"""

import logging
import os
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request

from app.db import get_db, get_current_mission, list_missions, get_mission

log = logging.getLogger("mango.edge.dashboard")

dashboard_bp = Blueprint("dashboard", __name__)


def _db_path():
    return current_app.config["DB_PATH"]


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _last_sensor_readings(db_path, n=3):
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


def _check_vps_reachable():
    import urllib.request
    vps_url = os.environ.get("VPS_URL", "").rstrip("/")
    if not vps_url:
        return False
    try:
        req = urllib.request.Request(
            vps_url + "/api/v1/health",
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except Exception as exc:
        log.warning("VPS health check failed for %s: %s", vps_url, exc)
        return False


@dashboard_bp.route("/status")
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
        "battery": None,
    }), 200


@dashboard_bp.route("/missions")
def list_missions_route():
    raw_limit = request.args.get("limit", 50)
    try:
        limit = max(1, min(200, int(raw_limit)))
    except (TypeError, ValueError):
        log.warning("Invalid limit=%r — using 50", raw_limit)
        limit = 50

    missions = list_missions(_db_path(), limit=limit)
    return jsonify({"missions": missions, "count": len(missions)}), 200


@dashboard_bp.route("/missions/<string:mission_id>/summary")
def mission_summary(mission_id):
    mission = get_mission(_db_path(), mission_id)
    if not mission:
        return jsonify({"error": "mission not found"}), 404

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


@dashboard_bp.route("/health")
def health():
    return jsonify({"ok": True, "ts": _now_iso()}), 200
