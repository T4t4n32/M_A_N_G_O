from flask import Blueprint, jsonify, session
from datetime import datetime, timedelta
import random

temperature_bp = Blueprint("temperature", __name__)

@temperature_bp.route("/range/temperature")
def range_temperature():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    now = datetime.utcnow()
    data = []

    for i in range(24):
        data.append({
            "timestamp": (now - timedelta(hours=24 - i)).isoformat(),
            "value": round(random.uniform(24.0, 30.0), 2)
        })

    return jsonify(data)
