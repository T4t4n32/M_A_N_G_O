"""Local ingest routes on the edge node (:9100).

POST /ingest  — receive sensor/IMU/pose data from ESP32 serial reader
POST /state   — receive state change from mission state machine
"""

import json
import logging
import os
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request

from app.db import (
    create_mission,
    get_current_mission,
    insert_event,
    insert_imu,
    insert_pose,
    insert_sensor_reading,
    update_mission_state,
)

log = logging.getLogger("mango.edge.ingest")

ingest_bp = Blueprint("ingest", __name__)


def _db_path():
    return current_app.config["DB_PATH"]


def _mission_dir():
    return current_app.config["MISSION_DIR"]


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ─── JSONL file helpers ───────────────────────────────────────────────────────

def _mission_path(mission_id):
    return os.path.join(_mission_dir(), mission_id)


def _append_jsonl(mission_id, filename, record):
    try:
        mdir = _mission_path(mission_id)
        try:
            os.makedirs(mdir)
        except OSError:
            pass
        filepath = os.path.join(mdir, filename)
        with open(filepath, "a") as fh:
            fh.write(json.dumps(record) + "\n")
    except Exception as exc:
        log.warning("JSONL write error (%s/%s): %s", mission_id, filename, exc)


# ─── Routes ───────────────────────────────────────────────────────────────────

@ingest_bp.route("/ingest", methods=["POST"])
def ingest():
    payload = request.get_json(force=True, silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "expected JSON object"}), 400

    payload_type = (payload.get("type") or "").strip()
    mission_id = (payload.get("mission_id") or "").strip() or None

    db_path = _db_path()

    if mission_id:
        current = get_current_mission(db_path)
        if current is None or current["mission_id"] != mission_id:
            create_mission(db_path, mission_id)

    if payload_type == "sensor_reading":
        station = payload.get("station")
        source = payload.get("source")
        readings = payload.get("readings") or {}
        ts_device = payload.get("timestamp_device")

        if not isinstance(readings, dict) or not readings:
            return jsonify({"error": "readings must be a non-empty dict"}), 400

        count = insert_sensor_reading(
            db_path, mission_id, station, source, readings, ts_device
        )

        if mission_id:
            record = dict(payload)
            record["_ts_local"] = _now_iso()
            _append_jsonl(mission_id, "sensor_data.jsonl", record)

        return jsonify({"ok": True, "type": "sensor_reading", "stored": count}), 200

    elif payload_type == "imu":
        insert_imu(db_path, payload)
        if mission_id:
            record = dict(payload)
            record["_ts_local"] = _now_iso()
            _append_jsonl(mission_id, "imu_data.jsonl", record)
        return jsonify({"ok": True, "type": "imu"}), 200

    elif payload_type == "pose":
        insert_pose(db_path, payload)
        if mission_id:
            record = dict(payload)
            record["_ts_local"] = _now_iso()
            _append_jsonl(mission_id, "pose_data.jsonl", record)
        return jsonify({"ok": True, "type": "pose"}), 200

    elif payload_type == "event":
        event_type = payload.get("event_type") or "unknown"
        data = payload.get("data")
        insert_event(db_path, mission_id, event_type, data)
        if mission_id:
            record = dict(payload)
            record["_ts_local"] = _now_iso()
            _append_jsonl(mission_id, "events.jsonl", record)
        return jsonify({"ok": True, "type": "event"}), 200

    else:
        return jsonify({"error": "unknown payload type: '%s'" % payload_type}), 400


@ingest_bp.route("/state", methods=["POST"])
def state_change():
    payload = request.get_json(force=True, silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "expected JSON object"}), 400

    mission_id = (payload.get("mission_id") or "").strip()
    state = (payload.get("state") or "").strip().upper()

    VALID_STATES = (
        "BOOT", "SELF_CHECK", "IDLE", "ARMED",
        "FIELD_RUNNING", "PAUSED", "RETURNING",
        "ERROR", "MISSION_FINISHED", "SYNCING", "STANDBY",
    )

    if not mission_id:
        return jsonify({"error": "mission_id required"}), 400
    if state not in VALID_STATES:
        return jsonify({"error": "invalid state '%s'" % state}), 400

    db_path = _db_path()
    device_id = payload.get("device_id") or os.environ.get("DEVICE_ID")

    create_mission(db_path, mission_id, device_id=device_id)
    update_mission_state(db_path, mission_id, state)

    insert_event(db_path, mission_id, "state_change", {
        "state": state,
        "source": payload.get("source", "state_machine"),
    })

    _append_jsonl(mission_id, "events.jsonl", {
        "type": "state_change",
        "mission_id": mission_id,
        "state": state,
        "_ts_local": _now_iso(),
    })

    log.info("Mission %s -> %s", mission_id, state)
    return jsonify({"ok": True, "mission_id": mission_id, "state": state}), 200
