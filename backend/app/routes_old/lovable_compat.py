from __future__ import annotations

from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request
from sqlalchemy import desc

# These imports assume your backend already has SQLAlchemy models like:
# - SensorReading (ts, type, value, unit)
# - optional Sensor/Station models
#
# If your model names differ, update imports accordingly.
from app.extensions import db
from app.models import SensorReading  # adjust if your project uses a different path


compat_bp = Blueprint("lovable_compat", __name__)

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _map_type_to_internal(t: str) -> str:
    t = (t or "").strip().lower()
    if t == "temperature":
        return "temp"
    return t

def _map_type_to_ui(t: str) -> str:
    t = (t or "").strip().lower()
    if t == "temp":
        return "temperature"
    return t

@compat_bp.get("/api/v1/health")
def ui_health():
    # Keep existing keys if your backend already returns db/redis/time
    # but ensure Lovable-friendly shape exists.
    try:
        db.session.execute(db.text("SELECT 1;"))
        status = "ok"
    except Exception:
        status = "degraded"

    return jsonify({
        "status": status,
        "timestamp": _now_iso(),
    }), 200

@compat_bp.get("/api/v1/metrics")
def ui_metrics():
    # Reads distinct types from SensorReading and maps them for UI.
    rows = db.session.execute(db.text("SELECT DISTINCT type FROM sensor_readings;")).fetchall()
    types = sorted({str(r[0]) for r in rows if r and r[0] is not None})

    available = []
    for t in types:
        ui_t = _map_type_to_ui(t)
        if ui_t in ("ph", "temperature", "turbidity"):
            available.append(ui_t)

    # Backward compatible: include both available and raw list
    return jsonify({
        "available": sorted(set(available)),
        "metrics": types,
        "timestamp": _now_iso(),
    }), 200

@compat_bp.get("/api/v1/latest/by_type")
def ui_latest_by_type():
    # Fetch a handful of recent readings and pick the latest per type.
    rows = (SensorReading.query
            .order_by(desc(SensorReading.ts))
            .limit(300)
            .all())

    latest_internal = {}
    for r in rows:
        if r.type not in latest_internal:
            latest_internal[r.type] = r

    def pack(r):
        return {
            "value": float(r.value) if r.value is not None else None,
            "timestamp": r.ts.replace(tzinfo=timezone.utc).isoformat() if r.ts else _now_iso(),
            "unit": getattr(r, "unit", None) or None,
            "connected": None,  # optional
            "status": "unknown",
        }

    ui = {}
    # Map internal -> UI keys
    if "ph" in latest_internal:
        ui["ph"] = pack(latest_internal["ph"])
    if "temp" in latest_internal:
        ui["temperature"] = pack(latest_internal["temp"])
    if "turbidity" in latest_internal:
        ui["turbidity"] = pack(latest_internal["turbidity"])

    # Backward compatible wrapper (optional)
    wrapper = {}
    for k, r in latest_internal.items():
        wrapper[k] = {
            "station_id": getattr(r, "station_id", None),
            "ts": r.ts.replace(tzinfo=timezone.utc).isoformat() if r.ts else _now_iso(),
            "type": k,
            "unit": getattr(r, "unit", None),
            "value": float(r.value) if r.value is not None else None,
        }

    resp = {"station_id": None, "latest": wrapper, **ui}
    return jsonify(resp), 200

@compat_bp.get("/api/v1/range")
def ui_range():
    # Accept both UI types (temperature) and internal (temp)
    t = request.args.get("type", "").strip()
    minutes = int(request.args.get("minutes", "60"))
    minutes = max(1, min(minutes, 60 * 24 * 14))

    internal = _map_type_to_internal(t)

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)

    rows = (SensorReading.query
            .filter(SensorReading.type == internal)
            .filter(SensorReading.ts >= cutoff)
            .order_by(SensorReading.ts.asc())
            .limit(5000)
            .all())

    series = [{"ts": r.ts.replace(tzinfo=timezone.utc).isoformat(), "value": float(r.value)} for r in rows]

    # Return Lovable-friendly shape + keep extras if you want
    return jsonify({
        "type": _map_type_to_ui(internal),
        "minutes": minutes,
        "count": len(series),
        "series": series,
    }), 200
