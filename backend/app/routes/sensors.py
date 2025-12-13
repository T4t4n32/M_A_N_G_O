from flask import Blueprint, jsonify, session, request
import random

sensors_bp = Blueprint("sensors", __name__, url_prefix="/api")

@sensors_bp.route("/latest")
def latest():
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401

    return jsonify({
        "level": round(120 + random.uniform(-1, 1), 2),
        "temperature": round(26 + random.uniform(-0.5, 0.5), 2),
        "salinity": round(32 + random.uniform(-0.3, 0.3), 2)
    })
