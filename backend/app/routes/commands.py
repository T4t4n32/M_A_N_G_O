"""
POST /api/v1/commands                  — issue a command to a device (admin)
GET  /api/v1/commands/pending          — Jetson polls for pending commands (ingest key)
POST /api/v1/commands/<id>/ack         — device acknowledges command (ingest key)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, session

from app.auth_ingest import require_ingest_key
from app.extensions import db
from app.middleware.admin_required import admin_required
from app.models.mission import MissionCommand, VALID_COMMANDS

log = logging.getLogger("mango.commands")

commands_bp = Blueprint("commands", __name__, url_prefix="/api/v1/commands")


@commands_bp.post("")
@admin_required
def issue_command():
    body = request.get_json(force=True, silent=True) or {}

    device_id = (body.get("device_id") or "").strip()
    if not device_id:
        return jsonify({"error": "device_id is required"}), 400

    command = (body.get("command") or "").strip().upper()
    if not command:
        return jsonify({"error": "command is required"}), 400
    if command not in VALID_COMMANDS:
        return jsonify({
            "error": f"invalid command '{command}'",
            "valid_commands": list(VALID_COMMANDS),
        }), 400

    issued_by = session.get("user_id")
    mission_id = (body.get("mission_id") or "").strip() or None

    cmd = MissionCommand(
        device_id=device_id,
        mission_id=mission_id,
        command=command,
        params=body.get("params") or None,
        issued_by=issued_by,
        status="pending",
    )
    db.session.add(cmd)
    db.session.commit()

    log.info("Command %s issued to device %s by user %s", command, device_id, issued_by)
    return jsonify({"ok": True, "command": cmd.to_dict()}), 201


@commands_bp.get("/pending")
@require_ingest_key
def get_pending_commands():
    device_id = request.args.get("device_id", "").strip()
    if not device_id:
        return jsonify({"error": "device_id query param required"}), 400

    pending = (
        MissionCommand.query
        .filter_by(device_id=device_id, status="pending")
        .order_by(MissionCommand.issued_at.asc())
        .all()
    )

    now = datetime.now(timezone.utc)
    for cmd in pending:
        cmd.status = "delivered"
        cmd.delivered_at = now

    if pending:
        db.session.commit()

    return jsonify({
        "device_id": device_id,
        "commands": [c.to_dict() for c in pending],
    }), 200


@commands_bp.post("/<int:cmd_id>/ack")
@require_ingest_key
def acknowledge_command(cmd_id: int):
    cmd = db.session.get(MissionCommand, cmd_id)
    if not cmd:
        return jsonify({"error": "command not found"}), 404

    device_id = request.args.get("device_id", "").strip()
    if device_id and cmd.device_id != device_id:
        return jsonify({"error": "device_id mismatch"}), 403

    body = request.get_json(force=True, silent=True) or {}
    now = datetime.now(timezone.utc)

    status = (body.get("status") or "acknowledged").lower()
    if status not in ("acknowledged", "failed"):
        status = "acknowledged"

    cmd.status = status
    cmd.acknowledged_at = now
    db.session.commit()

    return jsonify({"ok": True, "command": cmd.to_dict()}), 200
