"""
POST /api/v1/ingest       — receive a single packet from bridge/gateway/edge
POST /api/v1/ingest/batch — receive multiple packets (store-and-forward replay)
GET  /api/v1/ingest/status — last ingest timestamps per device
GET  /api/v1/latest       — raw latest N readings (legacy endpoint kept for compat)
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import desc

from app.auth_ingest import require_ingest_key
from app.extensions import db, redis_client
from app.models_compat import CompatReading, CompatStation, DeviceRegistry, IngestPacket

log = logging.getLogger("mango.ingest")

compat_bp = Blueprint("compat", __name__, url_prefix="/api/v1")

_tables_ready = False


def _ensure_tables() -> None:
    global _tables_ready
    if _tables_ready:
        return
    db.create_all()
    _tables_ready = True


def _get_or_create_station(station_name: str) -> CompatStation:
    st = CompatStation.query.filter_by(name=station_name).first()
    if not st:
        st = CompatStation(name=station_name)
        db.session.add(st)
        db.session.flush()
    return st


def _parse_dt(raw) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except Exception:
        return None


def _upsert_device(device_id: str, station_name: str, seq: int | None) -> None:
    dev = DeviceRegistry.query.filter_by(device_id=device_id).first()
    now = datetime.now(timezone.utc)
    if dev is None:
        dev = DeviceRegistry(
            device_id=device_id,
            station_name=station_name,
            last_seen=now,
            last_seq=seq,
            total_packets=1,
            status="online",
        )
        db.session.add(dev)
    else:
        dev.last_seen = now
        dev.station_name = station_name
        if seq is not None:
            dev.last_seq = seq
        dev.total_packets = (dev.total_packets or 0) + 1
        dev.status = "online"


def _process_new_sensor_reading(payload: dict, station_name: str, mission_id: str | None,
                                 packet_id: str | None, now: datetime) -> int:
    """Handle Sensors_V2 sensor_reading payload. Returns count of inserted rows."""
    readings_dict = payload.get("readings") or {}
    if not isinstance(readings_dict, dict):
        return 0

    st = _get_or_create_station(station_name)

    # Unit map for well-known sensor types
    UNIT_MAP = {
        "ph": "pH",
        "turbidity_ntu": "NTU",
        "temperature_c": "°C",
    }

    inserted = 0
    for key, val in readings_dict.items():
        try:
            value = float(val)
        except (TypeError, ValueError):
            continue
        unit = UNIT_MAP.get(key)
        row = CompatReading(
            station_id=st.id,
            type=key,
            value=value,
            unit=unit,
            ts=now,
            packet_id=packet_id,
            mission_id=mission_id,
        )
        db.session.add(row)
        inserted += 1
    return inserted


def _process_imu(payload: dict, station_name: str, mission_id: str | None,
                 packet_id: str | None, now: datetime) -> int:
    """Store IMU fields as individual CompatReading rows."""
    st = _get_or_create_station(station_name)
    fields = {
        "imu_yaw": payload.get("yaw"),
        "imu_pitch": payload.get("pitch"),
        "imu_roll": payload.get("roll"),
        "imu_qx": payload.get("qx"),
        "imu_qy": payload.get("qy"),
        "imu_qz": payload.get("qz"),
        "imu_qw": payload.get("qw"),
        "imu_calibration": payload.get("calibration"),
    }
    inserted = 0
    for key, val in fields.items():
        if val is None:
            continue
        try:
            value = float(val)
        except (TypeError, ValueError):
            continue
        db.session.add(CompatReading(
            station_id=st.id,
            type=key,
            value=value,
            unit=None,
            ts=now,
            packet_id=packet_id,
            mission_id=mission_id,
        ))
        inserted += 1
    return inserted


def _process_pose(payload: dict, station_name: str, mission_id: str | None,
                  packet_id: str | None, now: datetime) -> int:
    """Store pose fields as CompatReading rows."""
    st = _get_or_create_station(station_name)
    fields = {
        "pose_x": payload.get("x"),
        "pose_y": payload.get("y"),
        "pose_z": payload.get("z"),
        "pose_yaw": payload.get("yaw"),
        "pose_confidence": payload.get("confidence"),
    }
    inserted = 0
    for key, val in fields.items():
        if val is None:
            continue
        try:
            value = float(val)
        except (TypeError, ValueError):
            continue
        db.session.add(CompatReading(
            station_id=st.id,
            type=key,
            value=value,
            unit=None,
            ts=now,
            packet_id=packet_id,
            mission_id=mission_id,
        ))
        inserted += 1
    return inserted


def _process_packet(payload: dict, now: datetime) -> dict:
    """Process one ingest packet. Returns {inserted, duplicated, station_name}.

    Supports two payload formats:
    - Legacy: {station:{name}, readings:[{type,value,unit}], ...}
    - Sensors_V2: {type:"sensor_reading"|"imu"|"pose", mission_id, station, readings:{...}}
    """
    packet_id = (payload.get("packet_id") or "").strip() or None
    device_id = (payload.get("device_id") or "").strip() or None
    seq = payload.get("seq")
    if seq is not None:
        try:
            seq = int(seq)
        except (TypeError, ValueError):
            seq = None

    payload_type = (payload.get("type") or "").strip()
    mission_id = (payload.get("mission_id") or "").strip() or None

    # Determine station name — new format has flat "station" string
    raw_station = payload.get("station")
    if isinstance(raw_station, dict):
        station_name = raw_station.get("name") or "MANGO Station"
    elif isinstance(raw_station, str) and raw_station:
        station_name = raw_station
    else:
        station_name = "MANGO Station"

    # Deduplication: if packet_id already exists, skip readings insertion
    if packet_id:
        existing = IngestPacket.query.filter_by(packet_id=packet_id).first()
        if existing:
            return {"inserted": 0, "duplicated": True, "station_name": station_name}

    inserted = 0

    if payload_type == "sensor_reading":
        # New Sensors_V2 format — readings is a dict, not a list
        inserted = _process_new_sensor_reading(
            payload, station_name, mission_id, packet_id, now
        )
    elif payload_type == "imu":
        inserted = _process_imu(payload, station_name, mission_id, packet_id, now)
    elif payload_type == "pose":
        inserted = _process_pose(payload, station_name, mission_id, packet_id, now)
    else:
        # Legacy format — readings is a list of {type, value, unit}
        readings = payload.get("readings") or []
        st = _get_or_create_station(station_name)
        for r in readings:
            r_type = str(r.get("type", "")).strip()
            if not r_type:
                continue
            try:
                value = float(r.get("value"))
            except (TypeError, ValueError):
                continue

            unit = r.get("unit")
            row = CompatReading(
                station_id=st.id,
                type=r_type,
                value=value,
                unit=str(unit) if unit is not None else None,
                ts=now,
                packet_id=packet_id,
                mission_id=mission_id,
            )
            db.session.add(row)
            inserted += 1

    # Register the packet for deduplication
    if packet_id and inserted > 0:
        pkt = IngestPacket(
            packet_id=packet_id,
            device_id=device_id,
            seq=seq,
            station_name=station_name,
            created_at_device=_parse_dt(payload.get("created_at_device")),
            created_at_edge=_parse_dt(payload.get("created_at_edge")),
            readings_count=inserted,
        )
        db.session.add(pkt)

    # Update device registry
    if device_id:
        _upsert_device(device_id, station_name, seq)

    return {"inserted": inserted, "duplicated": False, "station_name": station_name}


@compat_bp.post("/ingest")
@require_ingest_key
def ingest():
    _ensure_tables()
    now = datetime.now(timezone.utc)
    payload = request.get_json(force=True, silent=True) or {}
    result = _process_packet(payload, now)
    db.session.commit()

    if redis_client is not None and result["inserted"] > 0:
        try:
            redis_client.publish("mango:readings", json.dumps({
                "station": result["station_name"],
                "count": result["inserted"],
                "ts": now.isoformat(),
            }))
        except Exception:
            pass

    status = 200
    if result["duplicated"]:
        return jsonify({"ok": True, "inserted": 0, "duplicated": True,
                        "station": result["station_name"]}), 200

    return jsonify({
        "ok": True,
        "inserted": result["inserted"],
        "duplicated": False,
        "station": result["station_name"],
    }), status


@compat_bp.post("/ingest/batch")
@require_ingest_key
def ingest_batch():
    """Receive multiple packets from edge store-and-forward replay."""
    _ensure_tables()
    now = datetime.now(timezone.utc)
    body = request.get_json(force=True, silent=True) or {}

    packets = body.get("packets") or []
    if not isinstance(packets, list):
        return jsonify({"error": "packets must be a list"}), 400
    if len(packets) > 500:
        return jsonify({"error": "batch too large (max 500 packets)"}), 400

    total_inserted = 0
    total_duplicated = 0
    results = []

    for pkt in packets:
        if not isinstance(pkt, dict):
            continue
        r = _process_packet(pkt, now)
        total_inserted += r["inserted"]
        if r["duplicated"]:
            total_duplicated += 1
        results.append(r)

    db.session.commit()

    if redis_client is not None and total_inserted > 0:
        try:
            redis_client.publish("mango:readings", json.dumps({
                "station": "batch",
                "count": total_inserted,
                "ts": now.isoformat(),
            }))
        except Exception:
            pass

    return jsonify({
        "ok": True,
        "packets_received": len(packets),
        "total_inserted": total_inserted,
        "total_duplicated": total_duplicated,
    }), 200


@compat_bp.get("/ingest/status")
@require_ingest_key
def ingest_status():
    """Return last ingest info per device for monitoring."""
    _ensure_tables()
    devices = DeviceRegistry.query.order_by(DeviceRegistry.last_seen.desc()).all()
    now = datetime.now(timezone.utc)

    last_reading = CompatReading.query.order_by(desc(CompatReading.ts)).first()
    last_ts = last_reading.ts.isoformat() if last_reading else None

    return jsonify({
        "devices": [d.to_dict() for d in devices],
        "last_reading_ts": last_ts,
        "server_time": now.isoformat(),
    }), 200


@compat_bp.get("/latest")
def latest():
    _ensure_tables()

    try:
        n = max(1, min(500, int(request.args.get("limit", 50))))
    except (TypeError, ValueError):
        n = 50

    rows = CompatReading.query.order_by(desc(CompatReading.ts)).limit(n).all()
    return jsonify([
        {
            "station_id": r.station_id,
            "type": r.type,
            "value": r.value,
            "unit": r.unit,
            "ts": r.ts.isoformat(),
        }
        for r in rows
    ]), 200
