# app/routes/ph.py

from flask import Blueprint, jsonify
from app.services.sensor_store import get_latest

ph_bp = Blueprint("ph", __name__)

@ph_bp.route("/ph/latest")
def ph_latest():
    data = get_latest("ph")

    if data is None:
        return jsonify({"status": "offline"}), 503

    return jsonify(data)
