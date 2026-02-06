from __future__ import annotations

from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models.sensor import Sensor, SensorData

api = Blueprint("api", __name__)


def _parse_ts(ts: str | None) -> datetime | None:
    """
    Accepts ISO-8601 timestamps like:
    - 2026-02-06T02:10:00Z
    - 2026-02-06T02:10:00+00:00
    - 2026-02-06T02:10:00.123456+00:00
    Returns timezone-aware UTC datetime, or None.
    """
    if not ts:
        return None
    try:
        # Python's fromisoformat doesn't accept trailing "Z"
        ts_fixed = ts.replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts_fixed)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def _serialize_row(row: SensorData) -> dict:
    return dict(
        id=row.id,
        value=row.value,
        valid=row.valid,
        reason=row.reason,
        quality=row.quality,
        timestamp=row.timestamp.isoformat() if row.timestamp else None,
    )


@api.get("/sensors")
def list_sensors():
    try:
        sensors = Sensor.query.order_by(Sensor.id.asc()).all()
        return jsonify([
            dict(
                id=s.id,
                key=s.key,
                name=s.name,
                unit=s.unit,
                min_value=s.min_value,
                max_value=s.max_value,
                model=s.model,
                calibration_status=s.calibration_status,
                maintenance_mode=s.maintenance_mode,
                created_at=s.created_at.isoformat() if s.created_at else None,
            )
            for s in sensors
        ])
    except SQLAlchemyError as e:
        return jsonify(error="db_error", detail=str(e)), 503


@api.post("/sensors/<sensor_key>/data")
def ingest_sensor_data(sensor_key: str):
    payload = request.get_json(silent=True) or {}
    value = payload.get("value", None)
    ts_in = payload.get("timestamp", None)
    ts = _parse_ts(ts_in)

    try:
        sensor = Sensor.query.filter_by(key=sensor_key).first()
        if not sensor:
            return jsonify(error="not_found", detail="sensor_key not registered"), 404

        # Basic validation
        valid = True
        reason = None
        quality = "ok"

        if value is None:
            valid = False
            reason = "MISSING_VALUE"
            quality = "error"
        else:
            try:
                value = float(value)
            except Exception:
                valid = False
                reason = "NOT_A_NUMBER"
                quality = "error"

        if valid and sensor.min_value is not None and value < sensor.min_value:
            valid = False
            reason = "OUT_OF_RANGE_LOW"
            quality = "warn"

        if valid and sensor.max_value is not None and value > sensor.max_value:
            valid = False
            reason = "OUT_OF_RANGE_HIGH"
            quality = "warn"

        # Timestamp handling
        if ts_in is not None and ts is None:
            # you sent timestamp but it was not parseable
            return jsonify(error="bad_timestamp", detail="timestamp must be ISO-8601 (e.g. 2026-02-06T02:10:00Z)"), 400

        row = SensorData(
            sensor_id=sensor.id,
            value=value if valid else None,
            valid=valid,
            reason=reason,
            quality=quality,
            timestamp=ts,  # if None, model default applies (server time)
        )

        db.session.add(row)
        db.session.commit()

        return jsonify(ok=True, sensor_key=sensor.key, stored=_serialize_row(row)), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify(error="db_error", detail=str(e)), 503


@api.get("/sensors/<sensor_key>/data")
def list_sensor_data(sensor_key: str):
    try:
        sensor = Sensor.query.filter_by(key=sensor_key).first()
        if not sensor:
            return jsonify(error="not_found"), 404

        limit = request.args.get("limit", "50")
        try:
            limit_i = int(limit)
        except Exception:
            limit_i = 50
        limit_i = max(1, min(limit_i, 500))

        rows = (
            SensorData.query.filter_by(sensor_id=sensor.id)
            .order_by(SensorData.timestamp.desc())
            .limit(limit_i)
            .all()
        )

        return jsonify(
            sensor_key=sensor.key,
            count=len(rows),
            items=[_serialize_row(r) for r in rows],
        )
    except SQLAlchemyError as e:
        return jsonify(error="db_error", detail=str(e)), 503


@api.get("/sensors/<sensor_key>/latest")
def latest(sensor_key: str):
    """
    If limit=1 (default): returns {"latest": {...}}
    If limit>1: returns {"latest": {...}, "items": [...]}
    """
    try:
        sensor = Sensor.query.filter_by(key=sensor_key).first()
        if not sensor:
            return jsonify(error="not_found"), 404

        limit = request.args.get("limit", "1")
        try:
            limit_i = int(limit)
        except Exception:
            limit_i = 1
        limit_i = max(1, min(limit_i, 500))

        q = (
            SensorData.query.filter_by(sensor_id=sensor.id)
            .order_by(SensorData.timestamp.desc())
        )
        rows = q.limit(limit_i).all()

        latest_row = rows[0] if rows else None

        resp = dict(
            sensor_key=sensor.key,
            latest=_serialize_row(latest_row) if latest_row else None,
        )

        if limit_i > 1:
            resp["items"] = [_serialize_row(r) for r in rows]

        return jsonify(resp)

    except SQLAlchemyError as e:
        return jsonify(error="db_error", detail=str(e)), 503
