"""
M.A.N.G.O. — Dashboard API (ADD-ONLY)

Purpose
- Provide stable, dashboard-friendly read endpoints WITHOUT touching existing ingest/latest logic.
- This module is safe to add even if other route modules fail; it should not break app startup.

Endpoints (all under /api/v1)
- GET  /metrics                  -> list available metric types (e.g., ["temp","turbidity"])
- GET  /stations                 -> list stations (id + optional name)
- GET  /latest/by_type           -> latest reading per type (ideal for KPI cards)
- GET  /range                    -> time-series for charts (type + minutes/hours)

Query params
- station_id (int)   optional
- station (string)   optional (station name; only works if station table has "name")
- limit (int)        optional, for range (default 360, max 5000)
- minutes (int)      optional, range window
- hours (int)        optional, range window (alternative to minutes)
- type (string)      required for /range
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from flask import Blueprint, jsonify, request
from sqlalchemy import inspect, text

from app.extensions import db

dashboard_bp = Blueprint("dashboard_api", __name__, url_prefix="/api/v1")


# -----------------------------
# Helpers
# -----------------------------
def _json_error(code: str, message: str, status: int = 400, details: Any | None = None):
    payload: dict[str, Any] = {"error": {"code": code, "message": message}}
    if details is not None:
        payload["error"]["details"] = details
    return jsonify(payload), status


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _ts_to_iso(ts: Any) -> str | None:
    if ts is None:
        return None
    if hasattr(ts, "isoformat"):
        return ts.isoformat()
    return str(ts)


def _safe_int(value: Any, default: int | None = None) -> int | None:
    if value is None or value == "":
        return default
    try:
        return int(value)
    except Exception:
        return default


def _get_table_names() -> set[str]:
    try:
        return set(inspect(db.engine).get_table_names())
    except Exception:
        return set()


def _resolve_tables() -> dict[str, str | None]:
    """
    Try to find readings + stations tables without assuming the schema.

    Priority order:
    - mango_compat_readings / mango_compat_stations  (compat bridge layer)
    - sensor_readings / sensor_stations              (common naming)
    - readings / stations                            (generic)
    """
    tables = _get_table_names()

    candidates = [
        ("mango_compat_readings", "mango_compat_stations"),
        ("sensor_readings", "sensor_stations"),
        ("readings", "stations"),
    ]
    for readings, stations in candidates:
        if readings in tables:
            return {"readings": readings, "stations": stations if stations in tables else None}

    return {"readings": None, "stations": None}


def _resolve_station_id(stations_table: str | None, station_id: int | None, station_name: str | None) -> int | None:
    if station_id is not None:
        return station_id

    if not station_name or not stations_table:
        return None

    try:
        row = db.session.execute(
            text(f"SELECT id FROM {stations_table} WHERE name = :name LIMIT 1"),
            {"name": station_name},
        ).mappings().first()
        if row and row.get("id") is not None:
            return int(row["id"])
    except Exception:
        return None

    return None


# -----------------------------
# Endpoints
# -----------------------------
@dashboard_bp.get("/metrics")
def metrics():
    tables = _resolve_tables()
    readings_table = tables["readings"]
    stations_table = tables["stations"]

    if not readings_table:
        return _json_error("NO_TABLES", "No readings table found. Run db_init or check database.", 503)

    station_id = _safe_int(request.args.get("station_id"))
    station_name = request.args.get("station")
    station_id = _resolve_station_id(stations_table, station_id, station_name)

    where = ""
    params: dict[str, Any] = {}
    if station_id is not None:
        where = "WHERE station_id = :station_id"
        params["station_id"] = station_id

    try:
        rows = db.session.execute(
            text(f"SELECT DISTINCT type FROM {readings_table} {where} ORDER BY type ASC"),
            params,
        ).fetchall()
        out = [r[0] for r in rows if r and r[0] is not None]
        return jsonify({"metrics": out, "station_id": station_id}), 200
    except Exception as e:
        return _json_error("QUERY_FAILED", "Failed to query metrics.", 500, {"reason": str(e)})


@dashboard_bp.get("/stations")
def stations():
    tables = _resolve_tables()
    readings_table = tables["readings"]
    stations_table = tables["stations"]

    if stations_table:
        try:
            rows = db.session.execute(
                text(f"SELECT id, name FROM {stations_table} ORDER BY id ASC")
            ).mappings().all()
            out = [{"id": int(r["id"]), "name": r.get("name")} for r in rows]
            return jsonify({"stations": out}), 200
        except Exception:
            pass

    if not readings_table:
        return _json_error("NO_TABLES", "No readings table found. Run db_init or check database.", 503)

    try:
        rows = db.session.execute(
            text(f"SELECT DISTINCT station_id FROM {readings_table} ORDER BY station_id ASC")
        ).fetchall()
        out = [{"id": int(r[0]), "name": None} for r in rows if r and r[0] is not None]
        return jsonify({"stations": out}), 200
    except Exception as e:
        return _json_error("QUERY_FAILED", "Failed to query stations.", 500, {"reason": str(e)})


@dashboard_bp.get("/latest/by_type")
def latest_by_type():
    tables = _resolve_tables()
    readings_table = tables["readings"]
    stations_table = tables["stations"]

    if not readings_table:
        return _json_error("NO_TABLES", "No readings table found. Run db_init or check database.", 503)

    station_id = _safe_int(request.args.get("station_id"))
    station_name = request.args.get("station")
    station_id = _resolve_station_id(stations_table, station_id, station_name)

    scan = _safe_int(request.args.get("scan"), 800)
    scan = max(50, min(scan or 800, 5000))

    where = ""
    params: dict[str, Any] = {"scan": scan}
    if station_id is not None:
        where = "WHERE station_id = :station_id"
        params["station_id"] = station_id

    try:
        rows = db.session.execute(
            text(
                f"""
                SELECT station_id, ts, type, value, unit
                FROM {readings_table}
                {where}
                ORDER BY ts DESC
                LIMIT :scan
                """
            ),
            params,
        ).mappings().all()

        latest: dict[str, dict[str, Any]] = {}
        for r in rows:
            t = r.get("type")
            if not t or t in latest:
                continue
            latest[str(t)] = {
                "station_id": int(r.get("station_id")) if r.get("station_id") is not None else None,
                "ts": _ts_to_iso(r.get("ts")),
                "type": str(t),
                "unit": r.get("unit"),
                "value": float(r.get("value")) if r.get("value") is not None else None,
            }

        return jsonify({"station_id": station_id, "latest": latest}), 200
    except Exception as e:
        return _json_error("QUERY_FAILED", "Failed to query latest values.", 500, {"reason": str(e)})


@dashboard_bp.get("/range")
def range_series():
    tables = _resolve_tables()
    readings_table = tables["readings"]
    stations_table = tables["stations"]

    if not readings_table:
        return _json_error("NO_TABLES", "No readings table found. Run db_init or check database.", 503)

    metric_type = (request.args.get("type") or "").strip()
    if not metric_type:
        return _json_error("MISSING_TYPE", "Query param 'type' is required.", 400)

    station_id = _safe_int(request.args.get("station_id"))
    station_name = request.args.get("station")
    station_id = _resolve_station_id(stations_table, station_id, station_name)

    minutes = _safe_int(request.args.get("minutes"))
    hours = _safe_int(request.args.get("hours"))

    if minutes is None and hours is None:
        minutes = 60
    if hours is not None:
        minutes = int(hours) * 60

    minutes = max(1, min(int(minutes or 60), 60 * 24 * 14))

    limit = _safe_int(request.args.get("limit"), 360)
    limit = max(10, min(int(limit or 360), 5000))

    start_ts = _now_utc() - timedelta(minutes=minutes)

    params: dict[str, Any] = {"type": metric_type, "start": start_ts, "limit": limit}
    where_parts = ["type = :type", "ts >= :start"]
    if station_id is not None:
        where_parts.append("station_id = :station_id")
        params["station_id"] = station_id

    where_sql = " AND ".join(where_parts)

    try:
        rows = db.session.execute(
            text(
                f"""
                SELECT ts, value, unit
                FROM {readings_table}
                WHERE {where_sql}
                ORDER BY ts ASC
                LIMIT :limit
                """
            ),
            params,
        ).mappings().all()

        series = [{"ts": _ts_to_iso(r.get("ts")), "value": r.get("value"), "unit": r.get("unit")} for r in rows]

        return jsonify(
            {
                "station_id": station_id,
                "type": metric_type,
                "minutes": minutes,
                "count": len(series),
                "series": series,
            }
        ), 200
    except Exception as e:
        return _json_error("QUERY_FAILED", "Failed to query time series.", 500, {"reason": str(e)})
