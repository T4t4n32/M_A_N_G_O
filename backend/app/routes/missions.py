"""
GET  /api/v1/missions                       — list missions
POST /api/v1/missions                       — create / upsert mission
GET  /api/v1/missions/<mission_id>          — single mission
GET  /api/v1/missions/<mission_id>/readings — readings linked to this mission
GET  /api/v1/missions/<mission_id>/events   — event log for this mission
GET  /api/v1/missions/<mission_id>/map      — trajectory data (if available)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.auth_ingest import require_ingest_key
from app.extensions import db
from app.middleware.admin_required import login_required, admin_required
from app.models.mission import Mission, MissionEvent, VALID_STATES
from app.models_compat import CompatReading

log = logging.getLogger("mango.missions")

missions_bp = Blueprint("missions", __name__, url_prefix="/api/v1/missions")


def _require_ingest_or_admin(f):
    """Allow requests authenticated by either the ingest key OR an admin session."""
    from functools import wraps
    from flask import session
    from app.models.user import MangoUser

    @wraps(f)
    def wrapper(*args, **kwargs):
        import os
        import hmac

        configured_key = os.getenv("INGEST_API_KEY", "").strip() or None
        provided_key = (
            request.headers.get("X-Api-Key", "").strip()
            or request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        )

        # Ingest key path
        if configured_key and provided_key:
            if hmac.compare_digest(provided_key.encode(), configured_key.encode()):
                return f(*args, **kwargs)

        # No key configured → accept ingest key path (dev mode)
        if not configured_key:
            return f(*args, **kwargs)

        # Session admin path
        uid = session.get("user_id")
        if uid:
            user = db.session.get(MangoUser, uid)
            if user and user.active and user.role == "admin":
                return f(*args, **kwargs)

        return jsonify({"error": "authentication required"}), 401

    return wrapper


@missions_bp.get("")
@login_required
def list_missions():
    q = Mission.query

    device_id = request.args.get("device_id")
    if device_id:
        q = q.filter_by(device_id=device_id)

    state = request.args.get("state")
    if state:
        q = q.filter_by(state=state)

    try:
        limit = max(1, min(500, int(request.args.get("limit", 50))))
    except (TypeError, ValueError):
        limit = 50

    missions = q.order_by(Mission.created_at.desc()).limit(limit).all()
    return jsonify({"missions": [m.to_dict() for m in missions]}), 200


@missions_bp.post("")
@_require_ingest_or_admin
def create_or_update_mission():
    body = request.get_json(force=True, silent=True) or {}

    mission_id = (body.get("mission_id") or "").strip()
    if not mission_id:
        return jsonify({"error": "mission_id is required"}), 400

    state = (body.get("state") or "IDLE").upper()
    if state not in VALID_STATES:
        return jsonify({"error": f"invalid state '{state}'", "valid": list(VALID_STATES)}), 400

    mission = Mission.query.filter_by(mission_id=mission_id).first()
    now = datetime.now(timezone.utc)

    if mission is None:
        mission = Mission(
            mission_id=mission_id,
            device_id=body.get("device_id"),
            state=state,
        )
        db.session.add(mission)
        created = True
    else:
        created = False
        mission.state = state
        if body.get("device_id"):
            mission.device_id = body["device_id"]
        mission.updated_at = now

    # Update timestamps based on state transitions
    if state == "FIELD_RUNNING" and not mission.started_at:
        mission.started_at = now
    if state in ("MISSION_FINISHED", "SYNCING", "STANDBY") and not mission.ended_at:
        mission.ended_at = now

    if body.get("summary") is not None:
        mission.summary = body["summary"]
    if body.get("notes") is not None:
        mission.notes = body["notes"]

    db.session.flush()

    # Append a state_change event
    event = MissionEvent(
        mission_ref_id=mission.id,
        mission_id=mission_id,
        event_type="state_change",
        data={"state": state, "source": body.get("source", "api")},
        ts=now,
    )
    db.session.add(event)
    db.session.commit()

    status_code = 201 if created else 200
    return jsonify({"ok": True, "mission": mission.to_dict()}), status_code


@missions_bp.get("/<string:mission_id>")
@login_required
def get_mission(mission_id: str):
    mission = Mission.query.filter_by(mission_id=mission_id).first()
    if not mission:
        return jsonify({"error": "mission not found"}), 404
    return jsonify({"mission": mission.to_dict()}), 200


@missions_bp.get("/<string:mission_id>/readings")
@login_required
def get_mission_readings(mission_id: str):
    mission = Mission.query.filter_by(mission_id=mission_id).first()
    if not mission:
        return jsonify({"error": "mission not found"}), 404

    try:
        limit = max(1, min(2000, int(request.args.get("limit", 500))))
    except (TypeError, ValueError):
        limit = 500

    # Query readings linked by mission_id column
    rows = (
        CompatReading.query
        .filter_by(mission_id=mission_id)
        .order_by(CompatReading.ts.desc())
        .limit(limit)
        .all()
    )

    return jsonify({
        "mission_id": mission_id,
        "count": len(rows),
        "readings": [
            {
                "id": r.id,
                "type": r.type,
                "value": r.value,
                "unit": r.unit,
                "ts": r.ts.isoformat(),
                "packet_id": r.packet_id,
            }
            for r in rows
        ],
    }), 200


@missions_bp.get("/<string:mission_id>/events")
@login_required
def get_mission_events(mission_id: str):
    mission = Mission.query.filter_by(mission_id=mission_id).first()
    if not mission:
        return jsonify({"error": "mission not found"}), 404

    try:
        limit = max(1, min(1000, int(request.args.get("limit", 200))))
    except (TypeError, ValueError):
        limit = 200

    events = (
        MissionEvent.query
        .filter_by(mission_id=mission_id)
        .order_by(MissionEvent.ts.desc())
        .limit(limit)
        .all()
    )

    return jsonify({
        "mission_id": mission_id,
        "count": len(events),
        "events": [e.to_dict() for e in events],
    }), 200


@missions_bp.get("/<string:mission_id>/map")
@login_required
def get_mission_map(mission_id: str):
    mission = Mission.query.filter_by(mission_id=mission_id).first()
    if not mission:
        return jsonify({"error": "mission not found"}), 404

    # Trajectory is stored in mission summary if synced from edge
    trajectory = []
    if mission.summary and isinstance(mission.summary, dict):
        trajectory = mission.summary.get("trajectory", [])

    return jsonify({
        "mission_id": mission_id,
        "trajectory": trajectory,
    }), 200
