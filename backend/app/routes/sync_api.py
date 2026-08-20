"""
Sync coordination API between edge nodes and VPS.

GET  /api/v1/sync/status  — returns pending/sent counts and last sync per device
POST /api/v1/sync/ack     — edge node acknowledges a successful sync window
POST /api/v1/sync/retry   — mark failed packets for retry (admin)

All endpoints require INGEST_API_KEY (same key as /ingest) or admin session.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from app.auth_ingest import require_ingest_key
from app.extensions import db
from app.middleware.admin_required import admin_required
from app.models_compat import DeviceRegistry, IngestPacket, MangoModemStatus

log = logging.getLogger("mango.sync")

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
    readings_count = None
    try:
        readings_count = db.session.execute(
            text("SELECT COUNT(*) FROM mango_compat_readings")
        ).scalar() or 0
    except Exception:
        db.session.rollback()
        log.error("Sync status: readings count query failed", exc_info=True)

    device_summaries = []
    for dev in devices:
        device_summaries.append({
            **dev.to_dict(),
            "sync_state": "synced" if dev.last_seen else "never_synced",
        })

    return jsonify({
        "server_time": now.isoformat(),
        "total_packets_received": total_packets,
        # null (not 0) when the count could not be read, so an outage is not
        # reported to the edge as "nothing stored".
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
    else:
        log.warning("Sync ack from unregistered device %r — last_seen not updated", device_id)

    return jsonify({
        "ok": True,
        "device_id": device_id,
        "device_registered": dev is not None,
        "acked_at": now.isoformat(),
    }), 200


@sync_bp.post("/telemetry")
@require_ingest_key
def sync_telemetry():
    """Receive modem/connectivity telemetry from an edge node.

    Body (JSON):
      device_id    str   — station identifier
      station_name str   — human-readable name (optional)
      modem        dict  — snapshot from huawei_api.get_modem_snapshot()
      reported_at  str   — ISO-8601 timestamp (optional)

    Upserts a row in mango_modem_status keyed by device_id.
    Also touches DeviceRegistry.last_seen so the device stays 'online'.
    """
    _ensure_tables()
    body = request.get_json(force=True, silent=True) or {}
    device_id = (body.get("device_id") or "").strip()
    if not device_id:
        return jsonify({"error": "device_id required"}), 400

    modem = body.get("modem") or {}
    now = datetime.now(timezone.utc)

    # Touch DeviceRegistry
    dev = DeviceRegistry.query.filter_by(device_id=device_id).first()
    if not dev:
        dev = DeviceRegistry(
            device_id=device_id,
            station_name=body.get("station_name") or device_id,
            registered_at=now,
        )
        db.session.add(dev)
    dev.last_seen = now
    if dev.status not in ("online", "stale"):
        dev.status = "online"

    # Upsert modem status
    ms = MangoModemStatus.query.filter_by(device_id=device_id).first()
    if not ms:
        ms = MangoModemStatus(device_id=device_id)
        db.session.add(ms)

    ms.available        = bool(modem.get("available", False))
    ms.connected        = bool(modem.get("connected", False))
    ms.status           = modem.get("status") or None
    ms.network_type     = modem.get("network_type") or None
    ms.signal_bars      = modem.get("signal_bars")
    ms.rssi             = modem.get("rssi")
    ms.rsrp             = modem.get("rsrp")
    ms.rsrq             = modem.get("rsrq")
    ms.sinr             = modem.get("sinr")
    ms.band             = modem.get("band") or None
    ms.operator         = modem.get("operator") or None
    ms.session_upload_bytes   = modem.get("session_upload_bytes")
    ms.session_download_bytes = modem.get("session_download_bytes")
    ms.total_upload_bytes     = modem.get("total_upload_bytes")
    ms.total_download_bytes   = modem.get("total_download_bytes")
    ms.session_seconds  = modem.get("session_seconds")
    ms.updated_at       = now
    ms.reported_at      = now

    sampled = modem.get("sampled_at")
    if sampled:
        try:
            ms.modem_sampled_at = datetime.fromisoformat(
                sampled.replace("Z", "+00:00")
            )
        except (ValueError, TypeError, AttributeError):
            log.warning("Telemetry from %s: unparseable sampled_at %r — stored as null",
                        device_id, sampled)

    db.session.commit()
    return jsonify({
        "ok": True,
        "device_id": device_id,
        "modem_available": ms.available,
        "modem_connected": ms.connected,
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
