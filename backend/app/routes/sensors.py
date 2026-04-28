from flask import Blueprint, jsonify, session
from datetime import datetime

sensors_bp = Blueprint("sensors", __name__, url_prefix="/api")

# NOTE: Serial ingestion is handled by services/serial_service.py (separate module).
# These endpoints return the latest cached reading from that service.
# Replace the placeholder dicts below with real serial reads once the
# serial service is connected.


def _require_auth():
    """Returns a 401 response if the session has no user_id."""
    if not session.get("user_id"):
        return jsonify({"error": "unauthorized"}), 401
    return None


@sensors_bp.route("/ph/latest")
def ph_latest():
    err = _require_auth()
    if err:
        return err
    # CHANGE_BEFORE_PRODUCTION: Replace with real serial read.
    return jsonify({
        "value": None,
        "unit": "pH",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "note": "serial not connected — replace with live read"
    })


@sensors_bp.route("/temperature/latest")
def temperature_latest():
    err = _require_auth()
    if err:
        return err
    # CHANGE_BEFORE_PRODUCTION: Replace with real serial read.
    return jsonify({
        "value": None,
        "unit": "°C",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "note": "serial not connected — replace with live read"
    })


@sensors_bp.route("/turbidity/latest")
def turbidity_latest():
    err = _require_auth()
    if err:
        return err
    # CHANGE_BEFORE_PRODUCTION: Replace with real serial read.
    return jsonify({
        "value": None,
        "unit": "NTU",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "note": "serial not connected — replace with live read"
    })
