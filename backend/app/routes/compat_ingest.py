"""
POST /api/v1/ingest  — recibe lecturas del bridge/gateway
GET  /api/v1/latest  — últimas N lecturas (lista cruda)
"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import desc

from app.extensions import db
from app.models_compat import CompatReading, CompatStation
from app.auth_ingest import require_ingest_key

compat_bp = Blueprint("compat", __name__, url_prefix="/api/v1")

_tables_ready = False


def _ensure_tables() -> None:
    global _tables_ready
    if _tables_ready:
        return
    db.create_all()
    _tables_ready = True


@compat_bp.post("/ingest")
@require_ingest_key
def ingest():
    _ensure_tables()

    payload = request.get_json(force=True, silent=True) or {}
    station_name = (payload.get("station") or {}).get("name") or "MANGO Station"
    readings = payload.get("readings") or []

    st = CompatStation.query.filter_by(name=station_name).first()
    if not st:
        st = CompatStation(name=station_name)
        db.session.add(st)
        db.session.flush()

    inserted = 0
    now = datetime.now(timezone.utc)

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
        )
        db.session.add(row)
        inserted += 1

    db.session.commit()
    return jsonify({"ok": True, "inserted": inserted, "station": station_name}), 200


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