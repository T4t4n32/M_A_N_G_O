"""
Sync coordination API between edge nodes and VPS.

GET  /api/v1/sync/status  — returns pending/sent counts and last sync per device
POST /api/v1/sync/ack     — edge node acknowledges a successful sync window
POST /api/v1/sync/retry   — mark failed packets for retry (admin)

All endpoints require INGEST_API_KEY (same key as /ingest) or admin session.
"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from app.auth_ingest import require_ingest_key
from app.extensions import db
from app.middleware.admin_required import admin_required
from app.models_compat import DeviceRegistry, IngestPacket

sync_bp = Blueprint("sync", __name__, url_prefix="/api/v1/sync")

_tables_ready = False


def _ensure_tables() -> None:
    global _tables_ready
    if _tables_ready:
        return
    db.create_all()
    _tables_ready = True


@sync_bp.get("/status")
@require_ingest_key
def sync_status():
    """Return per-device sync summary for monitoring."""
    _ensure_tables()
    now = datetime.now(timezone.utc)

    devices = DeviceRegistry.query.order_by(DeviceRegistry.last_seen.desc()).all()

    # Total unique packets received
    total_packets = IngestPacket.query.count()

    # Readings totals
    try:
        readings_count = db.session.execute(
            text("SELECT COUNT(*) FROM mango_compat_readings")
        ).scalar() or 0
    except Exception:
        readings_count = 0

    device_summaries = []
    for dev in devices:
        device_summaries.append({
            **dev.to_dict(),
            "sync_state": "synced" if dev.last_seen else "never_synced",
        })

    return jsonify({
        "server_time": now.isoformat(),
        "total_packets_received": total_packets,
        "total_readings_stored": readings_count,
        "devices": device_summaries,
    }), 200


@sync_bp.post("/ack")
@require_ingest_key
def sync_ack():
    """Edge node acknowledges successful sync. Updates device last_seen."""
    _ensure_tables()
    body = request.get_json(force=True, silent=True) or {}
    device_id = (body.get("device_id") or "").strip()
    if not device_id:
        return jsonify({"error": "device_id required"}), 400

    now = datetime.now(timezone.utc)
    dev = DeviceRegistry.query.filter_by(device_id=device_id).first()
    if dev:
        dev.last_seen = now
        dev.status = "online"
        db.session.commit()

    return jsonify({
        "ok": True,
        "device_id": device_id,
        "acked_at": now.isoformat(),
    }), 200


@sync_bp.post("/retry")
@admin_required
def sync_retry():
    """Admin-triggered: placeholder for future logic to re-queue failed edge data.

    Currently returns info about the most recent 10 packets for review.
    Full retry logic runs on the edge side (sync_manager.py).
    """
    _ensure_tables()
    recent = (
        IngestPacket.query
        .order_by(IngestPacket.received_at.desc())
        .limit(10)
        .all()
    )
    return jsonify({
        "ok": True,
        "note": "Retry logic runs on edge node. This endpoint provides recent packet info for review.",
        "recent_packets": [
            {
                "packet_id": p.packet_id,
                "device_id": p.device_id,
                "seq": p.seq,
                "received_at": p.received_at.isoformat(),
                "readings_count": p.readings_count,
            }
            for p in recent
        ],
    }), 200
