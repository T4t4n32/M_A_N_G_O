"""
Device registry API.

GET   /api/v1/devices              — list all known edge devices
GET   /api/v1/devices/<device_id>  — detail for one device
PATCH /api/v1/devices/<device_id>/status — manually set device status (admin)
"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from app.auth_ingest import require_ingest_key
from app.extensions import db
from app.middleware.admin_required import admin_required, login_required
from app.models_compat import DeviceRegistry

devices_bp = Blueprint("devices", __name__, url_prefix="/api/v1/devices")

_VALID_STATUSES = ("online", "offline", "stale", "maintenance", "unknown")

_tables_ready = False


def _ensure_tables() -> None:
    global _tables_ready
    if _tables_ready:
        return
    db.create_all()
    _tables_ready = True


@devices_bp.get("")
@login_required
def list_devices():
    _ensure_tables()
    devices = DeviceRegistry.query.order_by(DeviceRegistry.last_seen.desc()).all()
    return jsonify({
        "devices": [d.to_dict() for d in devices],
        "count": len(devices),
    }), 200


@devices_bp.get("/<device_id>")
@login_required
def get_device(device_id: str):
    _ensure_tables()
    dev = DeviceRegistry.query.filter_by(device_id=device_id).first()
    if not dev:
        return jsonify({"error": "not_found", "device_id": device_id}), 404
    return jsonify(dev.to_dict()), 200


@devices_bp.patch("/<device_id>/status")
@admin_required
def set_device_status(device_id: str):
    _ensure_tables()
    dev = DeviceRegistry.query.filter_by(device_id=device_id).first()
    if not dev:
        return jsonify({"error": "not_found", "device_id": device_id}), 404

    body = request.get_json(force=True, silent=True) or {}
    new_status = (body.get("status") or "").strip()
    if new_status not in _VALID_STATUSES:
        return jsonify({
            "error": "invalid_status",
            "valid": list(_VALID_STATUSES),
        }), 400

    dev.status = new_status
    db.session.commit()
    return jsonify(dev.to_dict()), 200
