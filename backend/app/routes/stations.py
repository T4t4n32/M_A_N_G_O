"""
Registro y mapeo de estaciones y sensores (administración).

Endpoints (url_prefix=/api/v1/stations):
  POST   /                   — crear estación con metadatos geográficos
  GET    /<id>               — detalle de estación + sensores registrados
  PATCH  /<id>               — actualizar nombre / lat / lon / location
  POST   /<id>/sensors       — registrar sensor en la estación
  DELETE /<id>/sensors/<sid> — eliminar sensor de la estación
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.sensor import Sensor, SensorStation
from app.utils.auth import require_admin

stations_mgmt_bp = Blueprint("stations_mgmt", __name__, url_prefix="/api/v1/stations")

_require_admin = require_admin(auth_error="unauthorized", forbidden_message="Solo administradores")


def _station_dict(st: SensorStation) -> dict:
    return {
        "id":       st.id,
        "name":     st.name,
        "location": st.location,
        "lat":      st.lat,
        "lon":      st.lon,
        "created_at": st.created_at.isoformat() if st.created_at else None,
    }


def _sensor_dict(s: Sensor) -> dict:
    return {
        "id":         s.id,
        "station_id": s.station_id,
        "type":       s.type,
        "unit":       s.unit,
        "label":      s.label,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@stations_mgmt_bp.post("/")
@_require_admin
def create_station():
    data     = request.get_json(silent=True) or {}
    name     = (data.get("name") or "").strip()
    location = (data.get("location") or "").strip() or None
    lat      = data.get("lat")
    lon      = data.get("lon")

    if not name:
        return jsonify({"error": "name es requerido"}), 400

    if SensorStation.query.filter_by(name=name).first():
        return jsonify({"error": "Ya existe una estación con ese nombre"}), 409

    try:
        lat = float(lat) if lat is not None else None
        lon = float(lon) if lon is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "lat y lon deben ser números"}), 400

    st = SensorStation(name=name, location=location, lat=lat, lon=lon)
    db.session.add(st)
    db.session.commit()

    return jsonify({"ok": True, "station": _station_dict(st)}), 201


@stations_mgmt_bp.get("/<int:station_id>")
def get_station(station_id: int):
    st = db.get_or_404(SensorStation, station_id)
    sensors = Sensor.query.filter_by(station_id=st.id).order_by(Sensor.id).all()
    out = _station_dict(st)
    out["sensors"] = [_sensor_dict(s) for s in sensors]
    return jsonify(out), 200


@stations_mgmt_bp.patch("/<int:station_id>")
@_require_admin
def update_station(station_id: int):
    st   = db.get_or_404(SensorStation, station_id)
    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            return jsonify({"error": "name no puede estar vacío"}), 400
        existing = SensorStation.query.filter_by(name=name).first()
        if existing and existing.id != st.id:
            return jsonify({"error": "Nombre ya en uso"}), 409
        st.name = name

    if "location" in data:
        st.location = (data["location"] or "").strip() or None

    for field in ("lat", "lon"):
        if field in data:
            raw = data[field]
            try:
                setattr(st, field, float(raw) if raw is not None else None)
            except (TypeError, ValueError):
                return jsonify({"error": f"{field} debe ser número"}), 400

    db.session.commit()
    return jsonify({"ok": True, "station": _station_dict(st)}), 200


@stations_mgmt_bp.post("/<int:station_id>/sensors")
@_require_admin
def add_sensor(station_id: int):
    st   = db.get_or_404(SensorStation, station_id)
    data = request.get_json(silent=True) or {}

    sensor_type = (data.get("type") or "").strip().lower()
    unit        = (data.get("unit") or "").strip() or None
    label       = (data.get("label") or "").strip()

    if not sensor_type:
        return jsonify({"error": "type es requerido"}), 400

    existing = Sensor.query.filter_by(
        station_id=st.id, type=sensor_type, label=label
    ).first()
    if existing:
        return jsonify({"error": "Sensor ya registrado en esta estación", "sensor": _sensor_dict(existing)}), 409

    s = Sensor(station_id=st.id, type=sensor_type, unit=unit, label=label)
    db.session.add(s)
    db.session.commit()

    return jsonify({"ok": True, "sensor": _sensor_dict(s)}), 201


@stations_mgmt_bp.delete("/<int:station_id>/sensors/<int:sensor_id>")
@_require_admin
def remove_sensor(station_id: int, sensor_id: int):
    s = Sensor.query.filter_by(id=sensor_id, station_id=station_id).first_or_404()
    db.session.delete(s)
    db.session.commit()
    return jsonify({"ok": True, "deleted_id": sensor_id}), 200
