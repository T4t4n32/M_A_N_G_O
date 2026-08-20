"""M.A.N.G.O — Dashboard Read API (stable + additive)

This module is READ-ONLY and is meant for dashboards (legacy + Lovable UI).

Endpoints (url_prefix=/api/v1):
- GET  /metrics
- GET  /stations
- GET  /latest/by_type
- GET  /range?type=<metric>&minutes=60

Compatibility:
- Returns BOTH:
  - legacy wrapper: {"latest": { "temp": {...}, ...}}
  - Lovable keys:  {"temperature": {...}, "ph": {...}, "turbidity": {...}}
- Accepts Lovable alias: type=temperature (maps internally to temp)
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Set

from flask import Blueprint, jsonify, request
from sqlalchemy import inspect, text

from app.extensions import db
from app.models_compat import DeviceRegistry, MangoModemStatus

log = logging.getLogger("mango.dashboard")

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
    except (TypeError, ValueError):
        log.warning("Ignoring non-integer query param %r — using default %r", value, default)
        return default


class DatabaseUnavailable(RuntimeError):
    """The schema could not be inspected, so a missing table cannot be
    distinguished from an unreachable database."""


def _db_unavailable_error():
    return _json_error("DB_UNAVAILABLE", "No se pudo consultar la base de datos.", 503)


def _get_table_names() -> set[str]:
    try:
        return set(inspect(db.engine).get_table_names())
    except Exception as exc:
        log.error("Cannot inspect database schema", exc_info=True)
        raise DatabaseUnavailable(str(exc)) from exc


def _resolve_tables() -> dict[str, str | None]:
    """Find readings/stations tables without assuming one schema.

    Priority:
    - mango_compat_readings / mango_compat_stations (bridge/gateway compat layer)
    - sensor_data / sensor_stations (requires JOIN; not fully wired yet)
    - readings / stations
    """
    tables = _get_table_names()
    candidates = [
        ("mango_compat_readings", "mango_compat_stations"),
        # sensor_data has sensor_id FK (no direct type/station_id cols) — needs JOIN to be useful
        ("sensor_data", "sensor_stations"),
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
        db.session.rollback()
        log.error("Station lookup failed for name=%r", station_name, exc_info=True)
        return None
    return None


def _internal_to_ui(metric_type: str) -> str:
    t = (metric_type or "").strip().lower()
    if t == "temp":
        return "temperature"
    return t


def _ui_to_internal(metric_type: str) -> str:
    t = (metric_type or "").strip().lower()
    if t == "temperature":
        return "temp"
    return t


def _pack_ui(item: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if not item:
        return None
    return {
        "value": item.get("value"),
        "timestamp": item.get("ts"),
        "unit": item.get("unit") or "",
        "connected": None,
        "status": "unknown",
    }


# -----------------------------
# Endpoints
# -----------------------------
@dashboard_bp.get("/metrics")
def metrics():
    try:
        tables = _resolve_tables()
    except DatabaseUnavailable:
        return _db_unavailable_error()
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
        internal = [r[0] for r in rows if r and r[0] is not None]

        # Lovable expects "available" as SensorType[] (ph/temperature/turbidity)
        ui_available: Set[str] = set()
        for t in internal:
            ui_t = _internal_to_ui(str(t))
            if ui_t in ("ph", "temperature", "turbidity"):
                ui_available.add(ui_t)

        return jsonify(
            {
                "metrics": internal,  # legacy/debug
                "available": sorted(ui_available),
                "station_id": station_id,
            }
        ), 200
    except Exception:
        db.session.rollback()
        log.error("metrics query failed", exc_info=True)
        return _json_error("QUERY_FAILED", "Failed to query metrics.", 500)


@dashboard_bp.get("/stations")
def stations():
    try:
        tables = _resolve_tables()
    except DatabaseUnavailable:
        return _db_unavailable_error()
    stations_table = tables["stations"]
    if not stations_table:
        return jsonify({"stations": []}), 200

    try:
        rows = db.session.execute(
            text(f"SELECT id, name FROM {stations_table} ORDER BY id ASC")
        ).mappings().all()
        out = [{"id": int(r["id"]), "name": r.get("name")} for r in rows if r.get("id") is not None]
        return jsonify({"stations": out}), 200
    except Exception:
        db.session.rollback()
        log.error("stations query failed", exc_info=True)
        return _json_error("QUERY_FAILED", "Failed to query stations.", 500)


@dashboard_bp.get("/latest/by_type")
def latest_by_type():
    try:
        tables = _resolve_tables()
    except DatabaseUnavailable:
        return _db_unavailable_error()
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

        latest: Dict[str, Dict[str, Any]] = {}
        for r in rows:
            t = r.get("type")
            if not t:
                continue
            t = str(t)
            if t in latest:
                continue
            latest[t] = {
                "station_id": int(r.get("station_id")) if r.get("station_id") is not None else None,
                "ts": _ts_to_iso(r.get("ts")),
                "type": t,
                "unit": r.get("unit"),
                "value": float(r.get("value")) if r.get("value") is not None else None,
            }

        # Lovable top-level keys (optional fields)
        ui = {
            "ph": _pack_ui(latest.get("ph")),
            "temperature": _pack_ui(latest.get("temp")),
            "turbidity": _pack_ui(latest.get("turbidity")),
        }
        ui = {k: v for k, v in ui.items() if v is not None}

        return jsonify({"station_id": station_id, "latest": latest, **ui}), 200
    except Exception:
        db.session.rollback()
        log.error("latest/by_type query failed", exc_info=True)
        return _json_error("QUERY_FAILED", "Failed to query latest values.", 500)


@dashboard_bp.get("/range")
def range_series():
    try:
        tables = _resolve_tables()
    except DatabaseUnavailable:
        return _db_unavailable_error()
    readings_table = tables["readings"]
    stations_table = tables["stations"]

    if not readings_table:
        return _json_error("NO_TABLES", "No readings table found. Run db_init or check database.", 503)

    metric_type = (request.args.get("type") or "").strip()
    if not metric_type:
        return _json_error("MISSING_TYPE", "Query param 'type' is required.", 400)

    metric_internal = _ui_to_internal(metric_type)

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

    params: dict[str, Any] = {"type": metric_internal, "start": start_ts, "limit": limit}
    where_parts = ["type = :type", "ts >= :start"]
    if station_id is not None:
        where_parts.append("station_id = :station_id")
        params["station_id"] = station_id

    where_sql = " AND ".join(where_parts)

    try:
        rows = db.session.execute(
            text(
                f"""
                SELECT ts, value
                FROM {readings_table}
                WHERE {where_sql}
                ORDER BY ts ASC
                LIMIT :limit
                """
            ),
            params,
        ).mappings().all()

        series = [{"ts": _ts_to_iso(r.get("ts")), "value": float(r.get("value")) if r.get("value") is not None else None} for r in rows]

        # Lovable expects type in ("ph","temperature","turbidity")
        ui_type = _internal_to_ui(metric_internal)
        if ui_type not in ("ph", "temperature", "turbidity"):
            # keep response still useful
            ui_type = "temperature" if metric_internal == "temp" else ui_type

        return jsonify(
            {
                "station_id": station_id,
                "type": ui_type,
                "minutes": minutes,
                "count": len(series),
                "series": series,
            }
        ), 200
    except Exception:
        db.session.rollback()
        log.error("range query failed (type=%s)", metric_internal, exc_info=True)
        return _json_error("QUERY_FAILED", "Failed to query time series.", 500)


@dashboard_bp.get("/edge/status")
def edge_status():
    """Return connectivity status for all registered edge devices.

    Merges DeviceRegistry (last seen, packet count) with MangoModemStatus
    (LTE signal, operator, connected state) for each device.

    Used by the dashboard DevicesPanel to show modem telemetry.
    """
    now = _now_utc()
    try:
        db.create_all()
        devices = DeviceRegistry.query.order_by(DeviceRegistry.last_seen.desc()).all()
        modem_map: dict[str, Any] = {}
        try:
            modems = MangoModemStatus.query.all()
            modem_map = {m.device_id: m.to_dict() for m in modems}
        except Exception:
            db.session.rollback()
            log.error("Modem telemetry query failed — devices reported without modem data",
                      exc_info=True)

        result = []
        for dev in devices:
            d = dev.to_dict()
            d["modem"] = modem_map.get(dev.device_id)
            result.append(d)

        return jsonify({
            "server_time": now.isoformat(),
            "devices": result,
            "count": len(result),
        }), 200
    except Exception:
        db.session.rollback()
        log.error("edge/status query failed", exc_info=True)
        return _json_error("QUERY_FAILED", "Failed to query edge status.", 500)
