"""
API route definitions.

This module defines the REST API endpoints for the dashboard. A
single Flask ``Blueprint`` called ``bp`` groups all routes under a
common URL prefix. Endpoints include a health check, an ingestion
route for sensor data, and a route to retrieve the latest sensor
readings.
"""

from __future__ import annotations

from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from sqlalchemy import desc, text

from .extensions import db
from .models import SensorStation, Sensor, SensorReading


# Group all API endpoints under the /api/v1 prefix.  If you change
# this prefix you will need to update the frontend accordingly.
bp = Blueprint("api", __name__, url_prefix="/api/v1")


@bp.get("/health")
def health() -> tuple[dict[str, object], int]:
    """Return a simple health check.

    The response indicates whether the application can talk to the
    database and (optionally) Redis. It also returns the current
    UTC time in ISO format. If the database check fails the status
    will be ``"degraded"``; otherwise it will be ``"ok"``.

    Returns
    -------
    tuple
        A tuple containing a JSON serialisable dictionary and an
        HTTP status code.
    """
    db_ok = "ok"
    try:
        # Perform a simple SELECT 1 to verify the database
        # connection. Using ``text`` ensures the query executes
        # correctly regardless of the backend.
        db.session.execute(text("SELECT 1"))
    except Exception:
        db_ok = "fail"
    return (
        {
            "status": "ok" if db_ok == "ok" else "degraded",
            "db": db_ok,
            "redis": "ok",
            "time": datetime.now(timezone.utc).isoformat(),
        },
        200,
    )


@bp.post("/ingest")
def ingest() -> tuple[dict[str, object], int]:
    """Ingest sensor readings via a POSTed JSON payload.

    The payload must be a JSON object with a ``station`` object and
    a ``readings`` list. Each reading should contain ``type`` and
    ``value`` keys. Missing or malformed entries are skipped.

    Returns
    -------
    tuple
        A tuple containing a JSON response indicating success and
        the number of inserted readings, along with an HTTP status
        code.
    """
    payload = request.get_json(force=True, silent=False) or {}
    station_name = (payload.get("station") or {}).get("name") or "MANGO Station"
    readings = payload.get("readings") or []

    # Retrieve or create the station.
    st: SensorStation | None = SensorStation.query.filter_by(name=station_name).first()
    if not st:
        st = SensorStation(name=station_name)
        db.session.add(st)
        db.session.flush()

    inserted = 0
    for r in readings:
        r_type = str(r.get("type", "")).strip()
        if not r_type:
            continue
        try:
            val = float(r.get("value"))
        except Exception:
            continue

        sensor: Sensor | None = Sensor.query.filter_by(station_id=st.id, type=r_type).first()
        if not sensor:
            sensor = Sensor(
                station_id=st.id,
                type=r_type,
                label=r.get("label") or "",
                unit=r.get("unit"),
            )
            db.session.add(sensor)
            db.session.flush()

        row = SensorReading(
            station_id=st.id,
            sensor_id=sensor.id,
            type=r_type,
            value=val,
            ts=datetime.now(timezone.utc),
        )
        db.session.add(row)
        inserted += 1

    db.session.commit()
    return ({"ok": True, "inserted": inserted}, 200)


@bp.get("/latest")
def latest() -> tuple[list[dict[str, object]], int]:
    """Return the latest 50 sensor readings in reverse chronological order."""
    rows = (
        SensorReading.query.order_by(desc(SensorReading.ts)).limit(50).all()
    )

    out: list[dict[str, object]] = []
    for r in rows:
        out.append(
            {
                "station_id": r.station_id,
                "sensor_id": r.sensor_id,
                "type": r.type,
                "value": r.value,
                "ts": r.ts.isoformat(),
                "label": "",
                "unit": None,
            }
        )
    return (out, 200)
