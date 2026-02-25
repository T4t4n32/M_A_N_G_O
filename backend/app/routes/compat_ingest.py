"""Compatibility endpoints for ingest/latest (additive).

Stable URLs:
- POST /api/v1/ingest
- GET  /api/v1/latest

Stores in dedicated tables mango_compat_* to avoid conflicts.
"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import desc

from app.extensions import db

# Import compat models (defined in app/models_compat.py)
from app.models_compat import CompatReading, CompatStation  # noqa: F401

compat_bp = Blueprint("compat", __name__, url_prefix="/api/v1")

_tables_ready = False


def _ensure_tables() -> None:
    global _tables_ready
    if _tables_ready:
        return
    db.create_all()
    _tables_ready = True


@compat_bp.post("/ingest")
def ingest():
    _ensure_tables()

    payload = request.get_json(force=True, silent=False) or {}
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
        except Exception:
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

    limit = request.args.get("limit", "50")
    try:
        n = max(1, min(500, int(limit)))
    except Exception:
        n = 50

    rows = CompatReading.query.order_by(desc(CompatReading.ts)).limit(n).all()

    out = []
    for r in rows:
        out.append(
            {
                "station_id": r.station_id,
                "type": r.type,
                "value": r.value,
                "unit": r.unit,
                "ts": r.ts.isoformat(),
            }
        )

    return jsonify(out), 200
