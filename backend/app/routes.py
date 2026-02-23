from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from flask import Blueprint, jsonify, request
from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models.sensor import Sensor, SensorData


api = Blueprint("api_v1", __name__, url_prefix="/api/v1")


def _parse_iso8601(ts: str) -> Optional[datetime]:
    """
    Acepta:
    - 2026-02-06T02:10:00Z
    - 2026-02-06T02:10:00+00:00
    """
    if not ts or not isinstance(ts, str):
        return None
    try:
        s = ts.strip()
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


@api.get("/health")
def health():
    try:
        db.session.execute(db.text("SELECT 1"))
        return jsonify(ok=True, status="ok", db=True)
    except Exception as e:
        return jsonify(ok=False, status="degraded", db=False, detail=str(e)), 503


@api.post("/ingest")
def ingest():
    """
    Body ejemplo:
    {
      "station": {"name":"MANGO Station"},
      "readings":[
        {"type":"temperature","value":26.4,"ts":"2026-02-18T16:38:40Z"},
        {"type":"ph","value":7.1}
      ]
    }
    """
    payload = request.get_json(silent=True) or {}
    readings = payload.get("readings", [])

    if not isinstance(readings, list) or len(readings) == 0:
        return jsonify(ok=False, error="bad_request", detail="readings must be a non-empty list"), 400

    inserted = 0

    try:
        for r in readings:
            if not isinstance(r, dict):
                continue

            sensor_type = r.get("type")
            value = r.get("value")

            if not sensor_type or value is None:
                continue

            sensor = Sensor.query.filter_by(key=sensor_type).first()
            if not sensor:
                # si el sensor no existe, lo ignoramos (o podrías crearlo)
                continue

            # parse float
            try:
                value_f = float(value)
            except Exception:
                continue

            # timestamp opcional (viene del seed o del dispositivo)
            ts = _parse_iso8601(r.get("ts") or r.get("timestamp") or "")
            row = SensorData(
                sensor_id=sensor.id,
                value=value_f,
                valid=True,
                reason=None,
                quality="ok",
            )
            if ts is not None:
                row.timestamp = ts

            db.session.add(row)
            inserted += 1

        db.session.commit()
        return jsonify(ok=True, inserted=inserted)
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify(ok=False, error="db_error", detail=str(e)), 503


@api.get("/latest")
def latest():
    """
    Devuelve una lista de lecturas recientes, por sensor.
    Query:
      ?limit=5
    """
    try:
        limit = int(request.args.get("limit", 3))
        limit = max(1, min(limit, 200))

        # tomamos las últimas N lecturas globales (sirve para gráfico/tabla)
        rows = (
            db.session.query(SensorData, Sensor)
            .join(Sensor, Sensor.id == SensorData.sensor_id)
            .order_by(desc(SensorData.timestamp))
            .limit(limit)
            .all()
        )

        items = []
        for sd, s in rows:
            items.append(
                {
                    "sensor_id": s.id,
                    "type": s.key,
                    "unit": s.unit,
                    "label": s.name or "",
                    "value": sd.value,
                    "ts": sd.timestamp.isoformat() if sd.timestamp else None,
                    "quality": sd.quality,
                    "valid": sd.valid,
                    "reason": sd.reason,
                }
            )

        # “latest” por sensor (última lectura por tipo)
        latest_by_type: Dict[str, Dict[str, Any]] = {}
        for it in items:
            t = it["type"]
            if t not in latest_by_type:
                latest_by_type[t] = it

        return jsonify(ok=True, items=items, latest=latest_by_type)
    except Exception as e:
        return jsonify(ok=False, error="server_error", detail=str(e)), 500


@api.get("/history")
def history():
    """
    Query ejemplo:
      /api/v1/history?type=temperature&hours=24&limit=500

    Devuelve puntos para el gráfico (orden ascendente).
    """
    try:
        sensor_type = request.args.get("type", "").strip()
        if not sensor_type:
            return jsonify(ok=False, error="bad_request", detail="type is required"), 400

        hours = int(request.args.get("hours", 24))
        hours = max(1, min(hours, 24 * 30))  # hasta 30 días

        limit = int(request.args.get("limit", 500))
        limit = max(1, min(limit, 5000))

        sensor = Sensor.query.filter_by(key=sensor_type).first()
        if not sensor:
            return jsonify(ok=False, error="not_found", detail="sensor type not registered"), 404

        since = datetime.now(timezone.utc) - timedelta(hours=hours)

        rows = (
            SensorData.query.filter(
                SensorData.sensor_id == sensor.id,
                SensorData.timestamp >= since,
            )
            .order_by(SensorData.timestamp.asc())
            .limit(limit)
            .all()
        )

        items = [
            {
                "ts": r.timestamp.isoformat() if r.timestamp else None,
                "value": r.value,
                "quality": r.quality,
                "valid": r.valid,
                "reason": r.reason,
            }
            for r in rows
        ]

        return jsonify(
            ok=True,
            type=sensor.key,
            unit=sensor.unit,
            label=sensor.name or "",
            hours=hours,
            count=len(items),
            items=items,
        )
    except ValueError:
        return jsonify(ok=False, error="bad_request", detail="hours/limit must be integers"), 400
    except Exception as e:
        return jsonify(ok=False, error="server_error", detail=str(e)), 500
